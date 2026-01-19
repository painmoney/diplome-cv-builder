import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Box,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";
import { Edit, GetApp, ArrowBack, Description } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabaseClient";

import MinimalistTemplate from "../components/templates/MinimalistTemplate";
import AcademicTemplate from "../components/templates/AcademicTemplate";
import GithubTemplate from "../components/templates/GithubTemplate";

import { exportToPDF } from "../components/export/ExportPDF";
import { exportToMarkdown } from "../components/export/ExportMarkdown";

export default function ResumePreview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingMD, setExportingMD] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (user) loadResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadResume = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Load resume error:", error);
      setSnackbar({
        open: true,
        message: `Ошибка загрузки резюме: ${error.message}`,
        severity: "error",
      });
    }

    if (data) setResume(data);
    setLoading(false);
  };

  const handleExportPDF = async () => {
    if (!resume) return;
    setExportingPDF(true);
    try {
      const result = await exportToPDF(resume.data, resume.template);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Ошибка при экспорте PDF",
        severity: "error",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!resume) return;
    setExportingMD(true);
    try {
      const result = await exportToMarkdown(resume.data);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Ошибка при экспорте Markdown",
        severity: "error",
      });
    } finally {
      setExportingMD(false);
    }
  };

  const handleTemplateChange = async (_, newTemplate) => {
    if (!newTemplate) return;
    if (!resume) return;
    if (newTemplate === resume.template) return;

    // Оптимистично обновим UI сразу
    const prev = resume.template;
    setResume((r) => ({ ...r, template: newTemplate }));

    setSavingTemplate(true);
    const { error } = await supabase
      .from("resumes")
      .update({ template: newTemplate, updated_at: new Date().toISOString() })
      .eq("id", resume.id);

    setSavingTemplate(false);

    if (error) {
      console.error("Template update error:", error);
      // откат
      setResume((r) => ({ ...r, template: prev }));
      setSnackbar({
        open: true,
        message: `Не удалось сменить шаблон: ${error.message}`,
        severity: "error",
      });
      return;
    }

    setSnackbar({
      open: true,
      message: "✅ Шаблон обновлён",
      severity: "success",
    });
  };

  const TemplateComponent = useMemo(() => {
    if (!resume?.data) return null;

    switch (resume.template) {
      case "academic":
        return <AcademicTemplate data={resume.data} />;
      case "github":
        return <GithubTemplate data={resume.data} />;
      case "minimalist":
      default:
        return <MinimalistTemplate data={resume.data} />;
    }
  }, [resume]);

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (!resume) {
    return (
      <Container sx={{ textAlign: "center", mt: 8 }}>
        <Typography variant="h5" gutterBottom>
          Резюме не найдено
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/resume-editor")}
          sx={{ mt: 2 }}
        >
          Создать резюме
        </Button>
      </Container>
    );
  }

  const disabled = exportingPDF || exportingMD || savingTemplate;

  const templateLabel = {
    minimalist: "Минималистичный",
    academic: "Академический",
    github: "GitHub-стиль",
  }[resume.template] || resume.template;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Панель управления */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: 1,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          disabled={disabled}
        >
          Назад
        </Button>

        {/* Переключатель шаблонов */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Шаблон:
          </Typography>

          <ToggleButtonGroup
            value={resume.template}
            exclusive
            onChange={handleTemplateChange}
            size="small"
            disabled={disabled}
          >
            <ToggleButton value="minimalist">Minimalist</ToggleButton>
            <ToggleButton value="academic">Academic</ToggleButton>
            <ToggleButton value="github">GitHub</ToggleButton>
          </ToggleButtonGroup>

          {savingTemplate && <Chip size="small" label="Сохранение..." />}
        </Box>

        {/* Экспорт/действия */}
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate("/resume-editor")}
            disabled={disabled}
          >
            Редактировать
          </Button>

          <Button
            variant="outlined"
            startIcon={<Description />}
            onClick={handleExportMarkdown}
            disabled={disabled}
          >
            {exportingMD ? "Экспорт..." : "Скачать Markdown"}
          </Button>

          <Button
            variant="contained"
            startIcon={<GetApp />}
            onClick={handleExportPDF}
            disabled={disabled}
          >
            {exportingPDF ? "Экспорт..." : "Скачать PDF"}
          </Button>
        </Box>
      </Box>

      {/* Превью резюме */}
      <Box
        sx={{
          bgcolor: "background.default",
          p: { xs: 2, md: 4 },
          borderRadius: 2,
          display: "flex",
          justifyContent: "center",
          overflowX: "auto",
        }}
      >
        {TemplateComponent}
      </Box>

      {/* Информация */}
      <Box sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="caption">
          Активный шаблон: {templateLabel} | Последнее изменение:{" "}
          {new Date(resume.updated_at).toLocaleString("ru-RU")}
        </Typography>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
