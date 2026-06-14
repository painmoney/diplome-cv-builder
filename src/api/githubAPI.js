export async function fetchGitHubRepos(username) {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return [];
  }

  const response = await fetch(
    `https://api.github.com/users/${normalizedUsername}/repos?sort=updated&per_page=100`
  );

  if (!response.ok) {
    let message = "";
    try {
      const body = await response.json();
      message = body?.message || "";
    } catch {
      // ignore parse error
    }

    if (response.status === 404) {
      throw new Error("Пользователь не найден");
    }

    const isRateLimit =
      response.status === 403 || response.status === 429 ||
      message.toLowerCase().includes("rate limit");

    if (isRateLimit) {
      const resetHeader = response.headers.get("x-ratelimit-reset");
      let suffix = "";
      if (resetHeader) {
        const resetDate = new Date(Number(resetHeader) * 1000);
        suffix = `. Лимит сбросится в ${resetDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
      }
      throw new Error(
        `Превышен лимит GitHub API. Попробуйте позже или используйте другой IP/VPN${suffix}`
      );
    }

    throw new Error(
      `Ошибка GitHub API: ${response.status}${message ? ` — ${message}` : ""}`
    );
  }

  const repos = await response.json();

  return repos.map((repo) => ({
    name: repo.name,
    description: repo.description,
    url: repo.html_url,
    stars: repo.stargazers_count,
    language: repo.language || null,
    forks: repo.forks_count ?? 0,
  }));
}