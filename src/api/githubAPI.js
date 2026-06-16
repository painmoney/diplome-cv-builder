import { supabase } from "./supabaseClient";

function getFallbackMessage(status) {
  if (status === 400) return "Некорректный GitHub username";
  if (status === 404) return "Пользователь GitHub не найден";
  if (status === 429) return "Превышен лимит GitHub API. Попробуйте позже.";
  if (status === 401 || status === 403) return "Не удалось выполнить запрос к GitHub. Проверьте настройки сервера.";
  return "GitHub API временно недоступен. Попробуйте позже.";
}

async function readErrorBody(error) {
  const ctx = error?.context;

  if (!ctx) return { status: 0, message: "" };

  const status = ctx.status || 0;

  try {
    const cloned = typeof ctx.clone === "function" ? ctx.clone() : null;
    if (!cloned) return { status, message: "" };

    const text = await cloned.text();
    if (!text) return { status, message: "" };

    try {
      const json = JSON.parse(text);
      const msg = json.error || json.message || json.details || "";
      return { status, message: msg };
    } catch {
      return { status, message: "" };
    }
  } catch {
    return { status, message: "" };
  }
}

export async function fetchGitHubRepos(username) {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return [];
  }

  const { data, error } = await supabase.functions.invoke("github-repos", {
    body: { username: normalizedUsername },
  });

  if (error) {
    const { status, message } = await readErrorBody(error);

    if (message) {
      throw new Error(message);
    }

    throw new Error(getFallbackMessage(status));
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
