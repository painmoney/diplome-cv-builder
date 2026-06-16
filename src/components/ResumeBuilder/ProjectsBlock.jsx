
import { Box, Stack, TextField, Button, Typography, Card, IconButton } from "@mui/material";
import { DeleteOutline, Add } from "@mui/icons-material";
import EmptyState from "../common/EmptyState";

const createProjectId = () =>
  `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const emptyProject = () => ({
  id: createProjectId(),
  name: "",
  role: "",
  description: "",
  techStack: "",
  link: "",
  period: "",
});

export default function ProjectsBlock({ data = [], onChange }) {
  const projects = Array.isArray(data) ? data : [];

  const addProject = () => {
    onChange([...projects, emptyProject()]);
  };

  const updateProject = (projectId, field, value) => {
    onChange(
      projects.map((p) => (p.id === projectId ? { ...p, [field]: value } : p))
    );
  };

  const removeProject = (projectId) => {
    onChange(projects.filter((p) => p.id !== projectId));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Ручные проекты
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Добавьте коммерческие, учебные или личные проекты, которые не обязательно доступны на GitHub.
      </Typography>

      <Button
        variant="outlined"
        startIcon={<Add />}
        onClick={addProject}
        sx={{ mb: 2 }}
      >
        Добавить проект
      </Button>

      {projects.length === 0 && (
        <EmptyState
          title="Пока нет ручных проектов"
          description="Добавьте проект, если хотите показать опыт вне GitHub."
          compact
        />
      )}

      <Stack spacing={2}>
        {projects.map((project) => (
          <Card
            key={project.id}
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>
                Проект
              </Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => removeProject(project.id)}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Box>

            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  label="Название проекта"
                  value={project.name}
                  onChange={(e) => updateProject(project.id, "name", e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Роль"
                  value={project.role}
                  onChange={(e) => updateProject(project.id, "role", e.target.value)}
                  size="small"
                  placeholder="Fullstack Developer"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Период"
                  value={project.period}
                  onChange={(e) => updateProject(project.id, "period", e.target.value)}
                  size="small"
                  placeholder="2024–2025"
                  sx={{ flex: 1 }}
                />
              </Stack>

              <TextField
                label="Технологии / стек"
                value={project.techStack}
                onChange={(e) => updateProject(project.id, "techStack", e.target.value)}
                size="small"
                placeholder="React, Node.js, PostgreSQL"
                fullWidth
              />

              <TextField
                label="Ссылка"
                value={project.link}
                onChange={(e) => updateProject(project.id, "link", e.target.value)}
                size="small"
                placeholder="https://..."
                fullWidth
              />

              <TextField
                label="Описание"
                value={project.description}
                onChange={(e) => updateProject(project.id, "description", e.target.value)}
                size="small"
                multiline
                rows={2}
                fullWidth
              />
            </Stack>
          </Card>
        ))}
      </Stack>

      {projects.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          Обычно достаточно 2–5 проектов.
        </Typography>
      )}
    </Box>
  );
}
