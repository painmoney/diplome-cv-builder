import React, { useState } from "react";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { GitHub, DeleteOutline } from "@mui/icons-material";
import { fetchGitHubRepos } from "../../api/githubAPI";

export default function GitHubBlock({ data = [], onChange }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchRepos = async () => {
    if (!username.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const repos = await fetchGitHubRepos(username);
      onChange(repos);
      setSuccess(`Загружено репозиториев: ${repos.length}`);
    } catch (err) {
      setError(err.message || "Ошибка загрузки репозиториев");
    } finally {
      setLoading(false);
    }
  };

  const clearRepos = () => {
    onChange([]);
    setError("");
    setSuccess("Список GitHub-проектов очищен");
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        GitHub Репозитории
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          id="github-username"
          label="GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
        />

        <Button
          variant="contained"
          onClick={fetchRepos}
          disabled={loading || !username.trim()}
          startIcon={<GitHub />}
        >
          {loading ? "Загрузка..." : data.length > 0 ? "Обновить" : "Подключить"}
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={clearRepos}
          disabled={loading || data.length === 0}
          startIcon={<DeleteOutline />}
        >
          Очистить
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {data.length > 0 ? (
        <Box>
          <Typography variant="body2" color="text.secondary">
            Найдено {data.length} репозиториев
          </Typography>

          {data.map((repo, i) => (
            <Box
              key={`${repo.url || repo.name}-${i}`}
              sx={{ py: 1, borderBottom: "1px solid #eee" }}
            >
              <Typography variant="body1">
                {repo.name} ⭐ {repo.stars || 0}
              </Typography>

              {repo.description && (
                <Typography variant="body2" color="text.secondary">
                  {repo.description}
                </Typography>
              )}

              {repo.url && (
                <Typography variant="caption" color="text.secondary">
                  {repo.url}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      ) : (
        <Alert severity="info">
          GitHub-проекты пока не загружены. Введите username и нажмите
          «Подключить».
        </Alert>
      )}
    </Box>
  );
}