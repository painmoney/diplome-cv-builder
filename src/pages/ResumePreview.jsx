import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Box,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
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

  const disabled = exportingPDF || exportingMD;

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
          borderRadius: 1,
          boxShadow: 1,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/dashboard")} disabled={disabled}>
          Назад
        </Button>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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
          bgcolor: "#f5f5f5",
          p: 4,
          borderRadius: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {TemplateComponent}
      </Box>

      {/* Информация о шаблоне */}
      <Box sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="caption">
          Шаблон: {resume.template} | Последнее изменение:{" "}
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
