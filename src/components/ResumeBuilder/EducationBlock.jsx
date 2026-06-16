import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Save, Close, School } from "@mui/icons-material";
import EmptyState from "../common/EmptyState";

const emptyEdu = {
  institution: "",
  institute: "",
  department: "",
  program: "",
  degree: "",
  years: "",
};

export default function EducationBlock({ data = [], onChange }) {
  const [newEdu, setNewEdu] = useState(emptyEdu);
  const [editingIndex, setEditingIndex] = useState(null);

  const resetForm = () => {
    setNewEdu(emptyEdu);
    setEditingIndex(null);
  };

  const saveEducation = () => {
    if (!newEdu.institution.trim()) return;

    if (editingIndex !== null) {
      const updated = data.map((item, index) =>
        index === editingIndex
          ? {
              ...item,
              ...newEdu,
              id: item.id || Date.now(),
            }
          : item
      );

      onChange(updated);
      resetForm();
      return;
    }

    const edu = { ...newEdu, id: Date.now() };
    onChange([...data, edu]);
    resetForm();
  };

  const editEducation = (index) => {
    const edu = data[index];

    setNewEdu({
      institution: edu.institution || "",
      institute: edu.institute || "",
      department: edu.department || "",
      program: edu.program || "",
      degree: edu.degree || "",
      years: edu.years || edu.year || "",
    });

    setEditingIndex(index);
  };

  const removeEducation = (index) => {
    onChange(data.filter((_, itemIndex) => itemIndex !== index));

    if (editingIndex === index) {
      resetForm();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Образование
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Можно указать вуз, колледж, курсы или сертификаты.
        Если образование не связано с IT, всё равно можно оставить кратко.
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          id="education-institution"
          label="ВУЗ"
          value={newEdu.institution}
          onChange={(e) =>
            setNewEdu({ ...newEdu, institution: e.target.value })
          }
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
        />

        <TextField
          id="education-institute"
          label="Институт"
          value={newEdu.institute}
          onChange={(e) =>
            setNewEdu({ ...newEdu, institute: e.target.value })
          }
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
        />

        <TextField
          id="education-department"
          label="Кафедра"
          value={newEdu.department}
          onChange={(e) =>
            setNewEdu({ ...newEdu, department: e.target.value })
          }
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
        />

        <TextField
          id="education-program"
          label="Направление подготовки/специальности"
          value={newEdu.program}
          onChange={(e) =>
            setNewEdu({ ...newEdu, program: e.target.value })
          }
          size="small"
          sx={{ flex: 1, minWidth: 280 }}
        />

        <TextField
          id="education-degree"
          label="Степень/сертификат"
          value={newEdu.degree}
          onChange={(e) =>
            setNewEdu({ ...newEdu, degree: e.target.value })
          }
          size="small"
          sx={{ minWidth: 220 }}
        />

        <TextField
          id="education-years"
          label="Годы"
          value={newEdu.years}
          placeholder="2022–2026"
          onChange={(e) =>
            setNewEdu({ ...newEdu, years: e.target.value })
          }
          size="small"
          sx={{ minWidth: 160 }}
        />

        <Button
          variant="contained"
          onClick={saveEducation}
          startIcon={editingIndex !== null ? <Save /> : <Add />}
          size="small"
        >
          {editingIndex !== null ? "Сохранить" : "Добавить"}
        </Button>

        {editingIndex !== null && (
          <Button
            variant="outlined"
            onClick={resetForm}
            startIcon={<Close />}
            size="small"
          >
            Отмена
          </Button>
        )}
      </Box>

      {data.length === 0 ? (
        <EmptyState
          icon={<School sx={{ fontSize: 40 }} />}
          title="Образование пока не добавлено"
          description="Укажите учебное заведение, направление подготовки или курсы."
          actionLabel="Добавить образование"
          onAction={() => document.getElementById("education-institution")?.focus()}
          compact
        />
      ) : (
        data.map((edu, index) => (
          <Card key={edu.id || index} sx={{ mb: 2 }}>
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
                    {edu.institution}
                  </Typography>

                  {edu.institute && (
                    <Typography variant="body2" color="text.secondary">
                      Институт: {edu.institute}
                    </Typography>
                  )}

                  {edu.department && (
                    <Typography variant="body2" color="text.secondary">
                      Кафедра: {edu.department}
                    </Typography>
                  )}

                  {edu.program && (
                    <Typography variant="body2" color="text.secondary">
                      Направление подготовки/специальности: {edu.program}
                    </Typography>
                  )}

                  <Typography variant="body2">
                    {edu.degree}
                    {edu.years ? ` (${edu.years})` : ""}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    onClick={() => editEducation(index)}
                    size="small"
                    aria-label="Редактировать образование"
                  >
                    <Edit />
                  </IconButton>

                  <IconButton
                    onClick={() => removeEducation(index)}
                    size="small"
                    aria-label="Удалить образование"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}