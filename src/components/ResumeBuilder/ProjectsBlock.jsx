import { useState, useRef } from "react";
import { Box, Stack, Button, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import EmptyState from "../common/EmptyState";
import ManualProjectCard from "./ManualProjectCard";
import { moveItem } from "../../utils/reorder";

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
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
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

  const handleReorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    onChange(moveItem(projects, fromIndex, toIndex));
  };

  const handleDragStart = (event, index) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleDrop = (event, index) => {
    event.preventDefault();
    const rawSource = event.dataTransfer.getData("text/plain");
    const source = rawSource === "" ? NaN : Number(rawSource);
    const fromIndex = Number.isInteger(source) ? source : draggedIndex;
    if (Number.isInteger(fromIndex)) handleReorder(fromIndex, index);
    setDraggedIndex(null);
    setDropIndex(null);
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

        {projects.map((project, index) => (
          <ManualProjectCard
            key={project.id}
            project={project}
            isDragging={draggedIndex === index}
            isDropTarget={dropIndex === index}
            onDragStart={(event) => handleDragStart(event, index)}
            onDragEnd={() => {
              setDraggedIndex(null);
              setDropIndex(null);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDropIndex(index);
            }}
            onDragLeave={() => setDropIndex(null)}
            onDrop={(event) => handleDrop(event, index)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
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
