import { supabase } from "./supabaseClient";

export async function fetchGitHubRepos(username) {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return [];
  }

  const { data, error } = await supabase.functions.invoke("github-repos", {
    body: { username: normalizedUsername },
  });

  if (error) {
    const msg = String(error?.message || error || "").toLowerCase();

    if (msg.includes("не найден") || msg.includes("not found") || msg.includes("404")) {
      throw new Error("Пользователь не найден");
    }

    if (msg.includes("лимит") || msg.includes("rate limit") || msg.includes("429")) {
      throw new Error("Превышен лимит GitHub API. Попробуйте позже");
    }

    if (msg.includes("token") || msg.includes("не настроен")) {
      throw new Error("GitHub token не настроен на сервере");
    }

    throw new Error(`Ошибка GitHub API: ${error.message || "неизвестная ошибка"}`);
  }

  if (data && typeof data === "object" && data.error) {
    throw new Error(data.error);
  }

  if (!Array.isArray(data)) {
    throw new Error("Неожиданный ответ от GitHub API");
  }

  return data.map((repo) => ({
    name: repo.name,
    description: repo.description,
    url: repo.url,
    stars: repo.stars ?? 0,
    language: repo.language || null,
    forks: repo.forks ?? 0,
  }));
}
