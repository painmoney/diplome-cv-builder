import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Add, Delete, Code } from "@mui/icons-material";
import { Reorder } from "framer-motion";
import EmptyState from "../common/EmptyState";
import ReorderCard from "../common/ReorderCard";

export function clampSkillLevel(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export default function SkillsBlock({
  data = [],
  showSkillLevels = true,
  onChange,
  onShowSkillLevelsChange,
}) {
  const [newSkill, setNewSkill] = useState("");
  const [level, setLevel] = useState(3);
  const [skillError, setSkillError] = useState("");

  const addSkill = () => {
    if (!newSkill.trim()) {
      setSkillError("Введите название навыка");
      return;
    }
    setSkillError("");
    const skill = { name: newSkill, level: clampSkillLevel(level), id: Date.now() };
    onChange([...data, skill]);
    setNewSkill("");
    setLevel(3);
  };

  const removeSkill = (id) => {
    onChange(data.filter((skill) => skill.id !== id));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Навыки
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Добавьте 5–10 ключевых технологий, которые хотите показать работодателю.
        Не обязательно указывать всё подряд — лучше выбрать стек, подтверждённый опытом или проектами.
      </Typography>

      <Box sx={{ mb: 1.5 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!showSkillLevels}
              onChange={(event) =>
                onShowSkillLevelsChange?.(!event.target.checked)
              }
              inputProps={{ "aria-label": "Не показывать уровень навыков" }}
            />
          }
          label="Не показывать уровень навыков"
          sx={{ m: 0 }}
        />
        {!showSkillLevels && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", ml: 4, mt: -0.5 }}
          >
            Уровни сохраняются, но не отображаются в резюме.
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 1, flexWrap: "wrap" }}>
        <TextField
          id="skills-skill"
          label="Навык"
          value={newSkill}
          onChange={(e) => {
            setNewSkill(e.target.value);
            if (skillError) setSkillError("");
          }}
          placeholder="Например: React, PostgreSQL, Docker"
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
          error={Boolean(skillError)}
          helperText={skillError || " "}
        />
        <TextField
          id="skills-level"
          label="Уровень (1–5)"
          type="number"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          onBlur={() => setLevel(clampSkillLevel(level))}
          inputProps={{ min: 1, max: 5 }}
          size="small"
          sx={{ width: 150 }}
        />
        <Button variant="contained" onClick={addSkill} startIcon={<Add />} size="small">
          Добавить
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 3 }}>
        1 — знаком, 3 — уверенно использую, 5 — экспертный уровень
      </Typography>

      {data.length === 0 ? (
        <EmptyState
          icon={<Code sx={{ fontSize: 40 }} />}
          title="Навыки пока не добавлены"
          description="Начните с основных технологий вашего стека: JavaScript, React, PostgreSQL, Docker..."
          actionLabel="Добавить навык"
          onAction={() => document.getElementById("skills-skill")?.focus()}
          compact
        />
      ) : (
        <Reorder.Group
          axis="y"
          values={data}
          onReorder={onChange}
          as="div"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
            maxWidth: 520,
            margin: 0,
            padding: 0,
          }}
        >
          {data.map((skill, index) => (
            <ReorderCard
              key={skill.id ?? `${skill.name}-${index}`}
              value={skill}
              dragLabel={`Перетащить навык «${skill.name || "Без названия"}»`}
              variant="outlined"
              cardSx={{
                bgcolor: "background.paper",
                "&:hover": {
                  borderColor: "primary.main",
                },
              }}
              contentSx={{
                py: 0.75,
                px: 1,
                "&:last-child": { pb: 0.75 },
              }}
              containerSx={{ alignItems: "center", gap: 1 }}
            >
              <Typography
                variant="body2"
                sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
              >
                {skill.name} ({skill.level}/5)
              </Typography>
              <IconButton
                size="small"
                onClick={() => removeSkill(skill.id)}
                aria-label={`Удалить навык «${skill.name || "Без названия"}»`}
              >
                <Delete fontSize="small" />
              </IconButton>
            </ReorderCard>
          ))}
        </Reorder.Group>
      )}
    </Box>
  );
}
