import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add, Delete, Edit, Save, Close, Work, AutoFixHigh } from "@mui/icons-material";
import { Reorder } from "framer-motion";
import EmptyState from "../common/EmptyState";
import ConfirmDialog from "../common/ConfirmDialog";
import AiConsentDialog from "../common/AiConsentDialog";
import ReorderCard from "../common/ReorderCard";
import { isAIAvailable, improveExperienceDescription } from "../../utils/aiService";
import { useAiConsent } from "../../hooks/useAiConsent";

const emptyExp = {
  company: "",
  position: "",
  period: "",
  description: "",
};

export default function ExperienceBlock({ data = [], onChange }) {
  const [newExp, setNewExp] = useState(emptyExp);
  const [editingIndex, setEditingIndex] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiPreviewText, setAiPreviewText] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [companyError, setCompanyError] = useState("");
  const { open: aiConsentOpen, requestAiAction, handleConfirm: aiConsentConfirm, handleDismiss: aiConsentDismiss, revokeConsent } = useAiConsent();

  useEffect(() => {
    if (isAIAvailable()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async script detection
      setAiAvailable(true);
      return;
    }
    const interval = setInterval(() => {
      if (isAIAvailable()) {
        setAiAvailable(true);
        clearInterval(interval);
      }
    }, 500);
    const timeout = setTimeout(() => clearInterval(interval), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const resetForm = () => {
    setNewExp(emptyExp);
    setEditingIndex(null);
  };

  const saveExperience = () => {
    if (!newExp.company.trim()) {
      setCompanyError("Укажите название компании");
      return;
    }
    setCompanyError("");

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

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    const idx = deleteIndex;
    setDeleteIndex(null);
    onChange(data.filter((_, itemIndex) => itemIndex !== idx));
    if (editingIndex === idx) resetForm();
  };

  const handleReorder = (nextData) => {
    if (editingIndex !== null) {
      const editingItem = data[editingIndex];
      const nextIndex = nextData.indexOf(editingItem);
      setEditingIndex(nextIndex === -1 ? null : nextIndex);
    }
    onChange(nextData);
  };

  const handleImproveDescription = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const improved = await improveExperienceDescription({
        description: newExp.description,
        position: newExp.position,
        company: newExp.company,
      });
      setAiPreviewText(improved);
      setAiPreviewOpen(true);
    } catch (err) {
      setAiError(err.message || "Ошибка AI-сервиса");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAI = () => {
    setNewExp({ ...newExp, description: aiPreviewText });
    setAiPreviewOpen(false);
    setAiPreviewText("");
  };

  const handleCancelAI = () => {
    setAiPreviewOpen(false);
    setAiPreviewText("");
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
            onChange={(e) => {
              setNewExp({ ...newExp, company: e.target.value });
              if (companyError) setCompanyError("");
            }}
            size="small"
            sx={{ flex: 1, minWidth: 220 }}
            error={Boolean(companyError)}
            helperText={companyError || " "}
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
          placeholder="Опишите задачи, стек и результат: что делали, какие технологии использовали, чего достигли"
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {aiAvailable && (
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              onClick={() => requestAiAction(handleImproveDescription)}
              disabled={aiLoading || !newExp.description?.trim()}
              startIcon={aiLoading ? <CircularProgress size={16} /> : <AutoFixHigh />}
            >
              {aiLoading ? "AI улучшает..." : "AI Улучшить описание"}
            </Button>
          )}
        </Box>

        {aiError && (
          <Alert severity="warning" sx={{ mt: -1 }} onClose={() => setAiError("")}>
            {aiError}
          </Alert>
        )}

        {aiAvailable && newExp.description?.trim() && !aiLoading && (
          <Typography variant="caption" color="text.secondary">
            AI обработает текст через внешний сервис. Не отправляйте конфиденциальные данные. Использует лимиты Puter-аккаунта.{" "}
            <Box component="span" sx={{ textDecoration: "underline", cursor: "pointer" }} onClick={revokeConsent}>
              Отозвать согласие
            </Box>
          </Typography>
        )}

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

      {data.length === 0 ? (
        <EmptyState
          icon={<Work sx={{ fontSize: 40 }} />}
          title="Опыт работы пока не добавлен"
          description="Добавьте работу, стажировку, фриланс или учебный проект с описанием результата."
          actionLabel="Добавить опыт"
          onAction={() => document.getElementById("experience-company")?.focus()}
          compact
        />
      ) : (
        <Reorder.Group
          axis="y"
          values={data}
          onReorder={handleReorder}
          as="div"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {data.map((exp, index) => (
            <ReorderCard
              key={exp.id || index}
              value={exp}
              dragLabel={`Перетащить опыт «${exp.company || "Без названия"}»`}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
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
                    onClick={() => setDeleteIndex(index)}
                    size="small"
                    aria-label="Удалить опыт"
                  >
                    <Delete />
                  </IconButton>
                </Box>
            </ReorderCard>
          ))}
        </Reorder.Group>
      )}

      <ConfirmDialog
        open={deleteIndex !== null}
        title="Удалить место работы?"
        description="Запись будет удалена из вашего резюме."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteIndex(null)}
      />

      <AiConsentDialog open={aiConsentOpen} onConfirm={aiConsentConfirm} onDismiss={aiConsentDismiss} />

      <Dialog
        open={aiPreviewOpen}
        onClose={handleCancelAI}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Улучшенное описание (AI)</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Проверьте текст. Нажмите «Применить», чтобы подставить в поле описания.
          </Alert>
          <TextField
            multiline
            fullWidth
            minRows={4}
            maxRows={12}
            value={aiPreviewText}
            onChange={(e) => setAiPreviewText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAI}>Отмена</Button>
          <Button onClick={handleApplyAI} variant="contained">
            Применить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
