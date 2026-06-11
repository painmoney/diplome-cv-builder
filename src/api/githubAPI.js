export async function fetchGitHubRepos(username) {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return [];
  }

  const response = await fetch(
    `https://api.github.com/users/${normalizedUsername}/repos?sort=updated&per_page=5`
  );

  if (!response.ok) {
    throw new Error("Пользователь не найден");
  }

  const repos = await response.json();

  return repos.map((repo) => ({
    name: repo.name,
    description: repo.description,
    url: repo.html_url,
    stars: repo.stargazers_count,
  }));
}