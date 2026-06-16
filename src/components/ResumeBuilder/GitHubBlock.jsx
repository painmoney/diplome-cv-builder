import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Checkbox,
  Divider,
} from "@mui/material";
import {
  GitHub,
  DeleteOutline,
  InsertDriveFile,
  OpenInNew,
} from "@mui/icons-material";
import { fetchGitHubRepos } from "../../api/githubAPI";
import EmptyState from "../common/EmptyState";

const MAX_SELECTED = 5;

function repoId(repo) {
  return repo.url || repo.name;
}

export default function GitHubBlock({ data = [], onChange }) {
  const [username, setUsername] = useState("");
  const [loadedRepos, setLoadedRepos] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState(() => new Set(data.map(repoId)));
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
      setLoadedRepos(repos);
      const existingUrls = new Set(data.map(repoId));
      setSelectedUrls(existingUrls);
      if (repos.length === 0) {
        setSuccess("Репозитории не найдены");
      } else {
        setSuccess(`Загружено репозиториев: ${repos.length}`);
      }
    } catch (err) {
      setError(err.message || "Ошибка загрузки репозиториев");
    } finally {
      setLoading(false);
    }
  };

  const toggleRepo = (url) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else if (next.size < MAX_SELECTED) {
        next.add(url);
      }
      return next;
    });
  };

  const confirmSelection = () => {
    const selected = loadedRepos.filter((r) => selectedUrls.has(repoId(r)));
    onChange(selected.slice(0, MAX_SELECTED));
    setSuccess(`Добавлено в резюме: ${selected.length} репозиториев`);
  };

  const clearSelection = () => {
    setSelectedUrls(new Set());
  };

  const removeSelected = (url) => {
    onChange(data.filter((r) => repoId(r) !== url));
  };

  const clearAll = () => {
    onChange([]);
    setLoadedRepos([]);
    setSelectedUrls(new Set());
    setError("");
    setSuccess("Список GitHub-проектов очищен");
  };

  const selectedCount = selectedUrls.size;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        GitHub Репозитории
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Импортируем только публичные репозитории. GitHub-проекты помогают подтвердить навыки и показать портфолио.
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 1, flexWrap: "wrap" }}>
        <TextField
          id="github-username"
          label="GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="octocat"
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
        />

        <Button
          variant="contained"
          onClick={fetchRepos}
          disabled={loading || !username.trim()}
          startIcon={<GitHub />}
        >
          {loading ? "Загрузка..." : "Загрузить репозитории"}
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={clearAll}
          disabled={loading}
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

      {loadedRepos.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Загруженные репозитории
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Выберите до {MAX_SELECTED} репозиториев для резюме. Выбрано: {selectedCount} из {MAX_SELECTED}
          </Typography>

          {loadedRepos.map((repo) => {
            const id = repoId(repo);
            const isSelected = selectedUrls.has(id);
            const isDisabled = !isSelected && selectedCount >= MAX_SELECTED;

            return (
              <Box
                key={id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  py: 1,
                  borderBottom: "1px solid #eee",
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggleRepo(id)}
                  sx={{ mt: 0.5 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" component="span">
                    {repo.name}
                    {repo.stars > 0 && <> ⭐ {repo.stars}</>}
                    {repo.language && <> · {repo.language}</>}
                    {repo.forks > 0 && <> · Fork: {repo.forks}</>}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {repo.description || "Описание не указано"}
                  </Typography>
                  {repo.url && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="a"
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                    >
                      {repo.url} <OpenInNew sx={{ fontSize: 12 }} />
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}

          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              onClick={confirmSelection}
              disabled={selectedCount === 0}
            >
              Добавить выбранные в резюме ({selectedCount})
            </Button>
            <Button
              variant="outlined"
              onClick={clearSelection}
              disabled={selectedCount === 0}
            >
              Очистить выбор
            </Button>
          </Box>
        </Box>
      )}

      {loadedRepos.length === 0 && data.length === 0 && !loading && (
        <EmptyState
          icon={<InsertDriveFile sx={{ fontSize: 40 }} />}
          title="GitHub-репозитории пока не импортированы"
          description="Введите username GitHub, чтобы загрузить и выбрать репозитории для резюме."
          compact
        />
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        Выбранные проекты для резюме
      </Typography>

      {data.length > 0 ? (
        <Box>
          {data.map((repo) => {
            const id = repoId(repo);
            return (
              <Box
                key={id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  py: 1,
                  borderBottom: "1px solid #eee",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1">
                    {repo.name}
                    {repo.stars > 0 && <> ⭐ {repo.stars}</>}
                    {repo.language && <> · {repo.language}</>}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {repo.description || "Описание не указано"}
                  </Typography>
                  {repo.url && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="a"
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
                    >
                      {repo.url} <OpenInNew sx={{ fontSize: 12 }} />
                    </Typography>
                  )}
                </Box>
                <Button
                  size="small"
                  color="error"
                  onClick={() => removeSelected(id)}
                  startIcon={<DeleteOutline />}
                  sx={{ mt: 0.5, flexShrink: 0 }}
                >
                  Удалить
                </Button>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Выберите до {MAX_SELECTED} репозиториев из списка выше
        </Typography>
      )}
    </Box>
  );
}
