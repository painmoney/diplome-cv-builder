import { useState, useRef } from "react";
import { Box, Stack, Button, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { Reorder } from "framer-motion";
import EmptyState from "../common/EmptyState";
import ManualProjectCard from "./ManualProjectCard";

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
  const [pendingNew, setPendingNew] = useState(null);
  const addBtnRef = useRef(null);

  const handleSave = (projectId, draft) => {
    if (pendingNew && projectId === pendingNew.id) {
      onChange([...projects, { ...draft }]);
      setPendingNew(null);
      return;
    }

    onChange(
      projects.map((p) => (p.id === projectId ? { ...p, ...draft } : p))
    );
  };

  const handleDelete = (projectId) => {
    if (pendingNew && projectId === pendingNew.id) {
      setPendingNew(null);
      return;
    }
    onChange(projects.filter((p) => p.id !== projectId));
  };

  const handleAdd = () => {
    const newProj = emptyProject();
    setPendingNew(newProj);
  };

  const handleCancelNew = () => {
    setPendingNew(null);
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
        ref={addBtnRef}
        variant="outlined"
        startIcon={<Add />}
        onClick={handleAdd}
        sx={{ mb: 2 }}
      >
        Добавить проект
      </Button>

      {projects.length === 0 && !pendingNew && (
        <EmptyState
          title="Пока нет ручных проектов"
          description="Добавьте проект, если хотите показать опыт вне GitHub."
          compact
        />
      )}

      <Stack spacing={2}>
        {pendingNew && (
          <ManualProjectCard
            key={pendingNew.id}
            project={pendingNew}
            isNew
            onSave={handleSave}
            onDelete={handleDelete}
            onCancel={handleCancelNew}
          />
        )}

        <Reorder.Group
          axis="y"
          values={projects}
          onReorder={onChange}
          as="div"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {projects.map((project) => (
            <ManualProjectCard
              key={project.id}
              project={project}
              reorderValue={project}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
        </Reorder.Group>
      </Stack>

      {projects.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          Обычно достаточно 2–5 проектов.
        </Typography>
      )}
    </Box>
  );
}
