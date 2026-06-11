import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Save, Close } from "@mui/icons-material";

const emptyExp = {
  company: "",
  position: "",
  period: "",
  description: "",
};

export default function ExperienceBlock({ data = [], onChange }) {
  const [newExp, setNewExp] = useState(emptyExp);
  const [editingIndex, setEditingIndex] = useState(null);

  const resetForm = () => {
    setNewExp(emptyExp);
    setEditingIndex(null);
  };

  const saveExperience = () => {
    if (!newExp.company.trim()) return;

    if (editingIndex !== null) {
      const updated = data.map((item, index) =>
        index === editingIndex
          ? {
              ...item,
              ...newExp,
              id: item.id || Date.now(),
            }
          : item
      );

      onChange(updated);
      resetForm();
      return;
    }

    const exp = { ...newExp, id: Date.now() };
    onChange([...data, exp]);
    resetForm();
  };

  const editExperience = (index) => {
    const exp = data[index];

    setNewExp({
      company: exp.company || "",
      position: exp.position || "",
      period: exp.period || "",
      description: exp.description || "",
    });

    setEditingIndex(index);
  };

  const removeExperience = (index) => {
    onChange(data.filter((_, itemIndex) => itemIndex !== index));

    if (editingIndex === index) {
      resetForm();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Опыт работы
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            id="experience-company"
            label="Компания"
            value={newExp.company}
            onChange={(e) =>
              setNewExp({ ...newExp, company: e.target.value })
            }
            size="small"
            sx={{ flex: 1, minWidth: 220 }}
          />

          <TextField
            id="experience-position"
            label="Должность"
            value={newExp.position}
            onChange={(e) =>
              setNewExp({ ...newExp, position: e.target.value })
            }
            size="small"
            sx={{ flex: 1, minWidth: 220 }}
          />

          <TextField
            id="experience-period"
            label="Период"
            value={newExp.period}
            placeholder="2022-2024"
            onChange={(e) =>
              setNewExp({ ...newExp, period: e.target.value })
            }
            size="small"
            sx={{ minWidth: 160 }}
          />
        </Box>

        <TextField
          id="experience-description"
          label="Описание (проекты, достижения)"
          value={newExp.description}
          onChange={(e) =>
            setNewExp({ ...newExp, description: e.target.value })
          }
          multiline
          rows={2}
          size="small"
        />

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            onClick={saveExperience}
            startIcon={editingIndex !== null ? <Save /> : <Add />}
            sx={{ alignSelf: "flex-start" }}
          >
            {editingIndex !== null ? "Сохранить опыт" : "Добавить опыт"}
          </Button>

          {editingIndex !== null && (
            <Button
              variant="outlined"
              onClick={resetForm}
              startIcon={<Close />}
              sx={{ alignSelf: "flex-start" }}
            >
              Отмена
            </Button>
          )}
        </Box>
      </Box>

      {data.map((exp, index) => (
        <Card key={exp.id || index} sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1">
                  {exp.position || "Должность не указана"} • {exp.company}
                </Typography>

                {exp.period && (
                  <Typography variant="body2" color="text.secondary">
                    {exp.period}
                  </Typography>
                )}

                {exp.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {exp.description}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  onClick={() => editExperience(index)}
                  size="small"
                  aria-label="Редактировать опыт"
                >
                  <Edit />
                </IconButton>

                <IconButton
                  onClick={() => removeExperience(index)}
                  size="small"
                  aria-label="Удалить опыт"
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}