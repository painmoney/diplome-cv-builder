export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type AuthenticateUser = (req: Request) => Promise<boolean>;

type HandlerDependencies = {
  authenticateUser: AuthenticateUser;
  fetchImpl?: typeof fetch;
  getGitHubToken: () => string | undefined;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function isValidGitHubUsername(username: string) {
  return (
    username.length >= 1 &&
    username.length <= 39 &&
    /^[A-Za-z0-9-]+$/.test(username) &&
    !username.startsWith("-") &&
    !username.endsWith("-")
  );
}

function hasBearerToken(req: Request) {
  return /^Bearer\s+\S+$/i.test(req.headers.get("Authorization")?.trim() || "");
}

export function createGitHubReposHandler({
  authenticateUser,
  fetchImpl = fetch,
  getGitHubToken,
}: HandlerDependencies) {
  return async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Метод не поддерживается" }, 405);
    }

    if (!hasBearerToken(req)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    try {
      if (!(await authenticateUser(req))) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    } catch (error) {
      console.error("github-repos auth error:", error);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    try {
      const { username } = await req.json();

      const normalizedUsername = String(username || "")
        .trim()
        .replace(/^@/, "");

      if (!normalizedUsername) {
        return jsonResponse({ error: "GitHub username не указан" }, 400);
      }

      if (!isValidGitHubUsername(normalizedUsername)) {
        return jsonResponse({ error: "Некорректный GitHub username" }, 400);
      }

      const githubToken = getGitHubToken();

      if (!githubToken) {
        return jsonResponse(
          { error: "GitHub token не настроен на сервере" },
          500
        );
      }

      const url = `https://api.github.com/users/${encodeURIComponent(
        normalizedUsername
      )}/repos?sort=updated&per_page=50`;

      const githubResponse = await fetchImpl(url, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "CV-Builder",
        },
      });

      const payload = await githubResponse.json().catch(() => null);

      if (!githubResponse.ok) {
        if (githubResponse.status === 404) {
          return jsonResponse({ error: "Пользователь GitHub не найден" }, 404);
        }

        if (githubResponse.status === 403 || githubResponse.status === 429) {
          const message = String(payload?.message || "").toLowerCase();
          const isRateLimit = message.includes("rate limit");

          if (isRateLimit) {
            const reset = githubResponse.headers.get("x-ratelimit-reset");

            if (reset) {
              const resetTime = new Date(Number(reset) * 1000).toLocaleTimeString(
                "ru-RU",
                { hour: "2-digit", minute: "2-digit" }
              );

              return jsonResponse(
                {
                  error: `Превышен лимит GitHub API. Попробуйте позже, примерно после ${resetTime}`,
                },
                429
              );
            }

            return jsonResponse(
              { error: "Превышен лимит GitHub API. Попробуйте позже" },
              429
            );
          }

          return jsonResponse(
            {
              error:
                payload?.message ||
                "GitHub отклонил запрос. Проверьте права токена или ограничения API",
            },
            githubResponse.status
          );
        }

        return jsonResponse(
          {
            error:
              payload?.message ||
              `Ошибка GitHub API. Код ответа: ${githubResponse.status}`,
          },
          githubResponse.status
        );
      }

      const repos = Array.isArray(payload)
        ? payload.map((repo) => ({
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            language: repo.language || null,
            forks: repo.forks_count ?? 0,
          }))
        : [];

      return jsonResponse(repos);
    } catch (error) {
      console.error("github-repos function error:", error);

      return jsonResponse(
        { error: "Ошибка при получении репозиториев GitHub" },
        500
      );
    }
  };
}
