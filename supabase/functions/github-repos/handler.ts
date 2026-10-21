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
  getGitHubTokenExpiresAt?: () => string | undefined;
  now?: () => Date;
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
  return /^Bearer [^\s]+$/i.test(req.headers.get("Authorization") || "");
}

function parseUtcExpiration(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) return null;

  const utcIsoPattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.(\d{1,3}))?Z$/;
  const match = utcIsoPattern.exec(normalized);
  if (!match) return null;

  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) return null;

  const milliseconds = (match[1] || "").padEnd(3, "0");
  const canonicalInput = normalized.replace(
    /(?:\.\d{1,3})?Z$/,
    `.${milliseconds}Z`
  );

  return new Date(timestamp).toISOString() === canonicalInput ? timestamp : null;
}

function getRateLimitDelaySeconds(response: Response, nowMs: number) {
  const retryAfter = response.headers.get("retry-after")?.trim();
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);

    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) {
      return Math.max(0, Math.ceil((retryAt - nowMs) / 1000));
    }
  }

  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) {
    return Math.max(0, Math.ceil(reset - nowMs / 1000));
  }

  return null;
}

export function createGitHubReposHandler({
  authenticateUser,
  fetchImpl = fetch,
  getGitHubToken,
  getGitHubTokenExpiresAt = () => undefined,
  now = () => new Date(),
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
    } catch {
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

      const githubToken = getGitHubToken()?.trim();
      if (!githubToken) {
        console.error("[github-repos] GITHUB_TOKEN_NOT_CONFIGURED");
        return jsonResponse(
          {
            error: "GITHUB_TOKEN_NOT_CONFIGURED",
            message:
              "Интеграция GitHub временно недоступна: серверный токен не настроен.",
          },
          503
        );
      }

      const expirationValue = getGitHubTokenExpiresAt();
      const expirationConfigured = Boolean(expirationValue?.trim());
      const expirationTimestamp = parseUtcExpiration(expirationValue);
      const requestTime = now().getTime();
      const expirationPassed =
        expirationTimestamp !== null && expirationTimestamp <= requestTime;

      if (expirationConfigured && expirationTimestamp === null) {
        console.warn(
          "[github-repos] Invalid GITHUB_TOKEN_EXPIRES_AT; expiration precheck skipped"
        );
      }

      if (expirationPassed) {
        console.error(
          "[github-repos] GITHUB_TOKEN_EXPIRED - rotate GITHUB_TOKEN"
        );
        return jsonResponse(
          {
            error: "GITHUB_TOKEN_EXPIRED",
            message:
              "Интеграция с GitHub временно недоступна. Серверный токен истёк.",
          },
          503
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
        if (githubResponse.status === 401) {
          console.error("[github-repos] GitHub token rejected", {
            status: 401,
            reason: "github_token_rejected",
            expirationConfigured,
            expirationPassed,
          });
          return jsonResponse(
            {
              error: "GITHUB_TOKEN_INVALID",
              message:
                "GitHub отклонил серверный токен. Он мог истечь, быть отозван или стать недействительным.",
            },
            502
          );
        }

        if (githubResponse.status === 404) {
          return jsonResponse(
            {
              error: "GITHUB_USER_NOT_FOUND",
              message: "Пользователь GitHub не найден.",
            },
            404
          );
        }

        const githubMessage = String(payload?.message || "").toLowerCase();
        const rateLimitRemaining = githubResponse.headers.get(
          "x-ratelimit-remaining"
        );
        const isRateLimit =
          githubResponse.status === 429 ||
          rateLimitRemaining === "0" ||
          githubMessage.includes("rate limit");

        if (
          (githubResponse.status === 403 || githubResponse.status === 429) &&
          isRateLimit
        ) {
          console.warn("[github-repos] GitHub rate limit reached", {
            status: githubResponse.status,
            remaining: rateLimitRemaining,
            retryAfterSeconds: getRateLimitDelaySeconds(
              githubResponse,
              requestTime
            ),
          });
          return jsonResponse(
            {
              error: "GITHUB_RATE_LIMIT",
              message:
                "Лимит запросов GitHub временно исчерпан. Попробуйте позже.",
            },
            429
          );
        }

        console.error("[github-repos] GitHub API request failed", {
          status: githubResponse.status,
          reason: "github_api_error",
        });
        return jsonResponse(
          {
            error: "GITHUB_API_ERROR",
            message: "Не удалось получить данные из GitHub. Попробуйте позже.",
          },
          502
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
    } catch {
      console.error("[github-repos] Unexpected handler failure", {
        reason: "unexpected_handler_error",
      });
      return jsonResponse(
        {
          error: "GITHUB_REPOS_FAILED",
          message: "Не удалось получить репозитории GitHub. Попробуйте позже.",
        },
        500
      );
    }
  };
}
