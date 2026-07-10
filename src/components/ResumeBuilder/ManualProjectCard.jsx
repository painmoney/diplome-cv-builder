import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
  Collapse,
  Chip,
  Stack,
} from "@mui/material";
import { Edit, Delete, DragIndicator, Save, Close } from "@mui/icons-material";

export default function ManualProjectCard({
  project,
  isNew = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onSave,
  onDelete,
  onCancel,
}) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [draft, setDraft] = useState({ ...project });
  const nameRef = useRef(null);

  useEffect(() => {
    if (isEditing && nameRef.current) {
      nameRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(project.id, draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isNew) {
      onCancel();
      return;
    }
    setDraft({ ...project });
    setIsEditing(false);
  };

  const handleEdit = () => {
    setDraft({ ...project });
    setIsEditing(true);
  };

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const projectName = project.name || "Проект без названия";

  const hasTechStack = draft.techStack && draft.techStack.trim();
  const techChips = hasTechStack
    ? draft.techStack.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  if (!isEditing) {
    return (
      <Card
        variant="outlined"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        sx={{
          p: 2,
          opacity: isDragging ? 0.55 : 1,
          borderStyle: isDropTarget ? "dashed" : undefined,
          borderColor: isDropTarget ? "primary.main" : undefined,
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
            <Box
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              aria-label={`Перетащить проект «${projectName}»`}
              title="Перетащить"
              sx={{
                display: "flex",
                alignItems: "center",
                alignSelf: "stretch",
                color: "text.secondary",
                cursor: "grab",
                "&:active": { cursor: "grabbing" },
              }}
            >
              <DragIndicator fontSize="small" />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {projectName}
              </Typography>

              {(project.role || project.period) && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {[project.role, project.period].filter(Boolean).join(" · ")}
                </Typography>
              )}

              {project.description && (
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                  {project.description}
                </Typography>
              )}

              {techChips.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                  {techChips.map((tech) => (
                    <Chip key={tech} label={tech} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}

              {project.link && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ wordBreak: "break-all" }}
                  >
                    {project.link}
                  </a>
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={handleEdit}
                aria-label={`Редактировать проект «${projectName}»`}
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(project.id)}
                aria-label={`Удалить проект «${projectName}»`}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Collapse in={isEditing} timeout="auto">
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                inputRef={nameRef}
                label="Название проекта"
                value={draft.name}
                onChange={(e) => updateDraft("name", e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Роль"
                value={draft.role}
                onChange={(e) => updateDraft("role", e.target.value)}
                size="small"
                placeholder="Fullstack Developer"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Период"
                value={draft.period}
                onChange={(e) => updateDraft("period", e.target.value)}
                size="small"
                placeholder="2024–2025"
                sx={{ flex: 1 }}
              />
            </Stack>

            <TextField
              label="Описание"
              value={draft.description}
              onChange={(e) => updateDraft("description", e.target.value)}
              size="small"
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="Технологии / стек"
              value={draft.techStack}
              onChange={(e) => updateDraft("techStack", e.target.value)}
              size="small"
              placeholder="React, Node.js, PostgreSQL"
              fullWidth
            />

            <TextField
              label="Ссылка"
              value={draft.link}
              onChange={(e) => updateDraft("link", e.target.value)}
              size="small"
              placeholder="https://..."
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                startIcon={<Save />}
              >
                {isNew ? "Сохранить проект" : "Сохранить изменения"}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCancel}
                startIcon={<Close />}
              >
                Отмена
              </Button>
            </Box>
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}
