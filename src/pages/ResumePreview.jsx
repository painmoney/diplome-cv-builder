import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "@mui/material";
import {
  Edit,
  GetApp,
  ArrowBack,
  Description,
  Image as ImageIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabaseClient";

import MinimalistTemplate from "../components/templates/MinimalistTemplate";
import AcademicTemplate from "../components/templates/AcademicTemplate";
import GithubTemplate from "../components/templates/GithubTemplate";

import { exportToPDF } from "../components/export/ExportPDF";
import { exportToMarkdown } from "../components/export/ExportMarkdown";

import html2canvas from "html2canvas";

export default function ResumePreview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingMD, setExportingMD] = useState(false);
  const [exportingIMG, setExportingIMG] = useState(null); // "png" | "jpg" | null

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const captureRef = useRef(null);

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

  const sanitizeFileName = (name) => {
    const base = String(name || "resume")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, "_")
      .trim();
    return base || "resume";
  };

  const handleExportImage = async (format) => {
    if (!resume) return;
    if (!captureRef.current) {
      setSnackbar({
        open: true,
        message: "Не удалось найти блок резюме для экспорта",
        severity: "error",
      });
      return;
    }

    setExportingIMG(format);

    try {
      // дождаться загрузки шрифтов (важно для красивого рендера)
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const scale = Math.max(2, window.devicePixelRatio || 2);

      const canvas = await html2canvas(captureRef.current, {
        scale,
        useCORS: true,
        backgroundColor: null, // сохранить фон как есть
        logging: false,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
      });

      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      const quality = format === "jpg" ? 0.92 : undefined;

      const dataUrl = canvas.toDataURL(mime, quality);

      const fileBase = sanitizeFileName(resume?.data?.profile?.name || "resume");
      const ext = format === "jpg" ? "jpg" : "png";

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${fileBase}_${resume.template}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSnackbar({
        open: true,
        message: `✅ ${ext.toUpperCase()} успешно скачан`,
        severity: "success",
      });
    } catch (err) {
      console.error("Image Export Error:", err);

      const msg = String(err || "").toLowerCase();
      const corsLikely =
        msg.includes("tainted") || msg.includes("cors") || msg.includes("cross-origin");

      setSnackbar({
        open: true,
        message: corsLikely
          ? "Экспорт изображения заблокирован из-за CORS (внешние картинки). Попробуйте убрать фото/внешние изображения или используйте PDF."
          : "Ошибка при экспорте PNG/JPG",
        severity: "error",
      });
    } finally {
      setExportingIMG(null);
    }
  };

  const handleChangeTemplate = async (newTemplate) => {
    if (!resume || !user || !newTemplate || newTemplate === resume.template) return;

    // мгновенно обновим UI
    const prev = resume.template;
    setResume((r) => ({ ...r, template: newTemplate }));

    const { error } = await supabase
      .from("resumes")
      .update({ template: newTemplate, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      console.error("Template update error:", error);
      // откат
      setResume((r) => ({ ...r, template: prev }));
      setSnackbar({
        open: true,
        message: `Ошибка сохранения шаблона: ${error.message}`,
        severity: "error",
      });
      return;
    }

    setSnackbar({
      open: true,
      message: "✅ Шаблон обновлен",
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

  const disabled = exportingPDF || exportingMD || exportingIMG;

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

        {/* Переключатель шаблонов прямо в превью */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="body2" color="text.secondary">
            Шаблон:
          </Typography>
          <ToggleButtonGroup
            value={resume.template}
            exclusive
            onChange={(_, v) => v && handleChangeTemplate(v)}
            size="small"
          >
            <ToggleButton value="minimalist">Minimal</ToggleButton>
            <ToggleButton value="academic">Academic</ToggleButton>
            <ToggleButton value="github">GitHub</ToggleButton>
          </ToggleButtonGroup>
        </Box>

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
            {exportingMD ? "Экспорт..." : "Markdown"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={() => handleExportImage("png")}
            disabled={disabled}
          >
            {exportingIMG === "png" ? "Экспорт..." : "PNG"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={() => handleExportImage("jpg")}
            disabled={disabled}
          >
            {exportingIMG === "jpg" ? "Экспорт..." : "JPG"}
          </Button>

          <Button
            variant="contained"
            startIcon={<GetApp />}
            onClick={handleExportPDF}
            disabled={disabled}
          >
            {exportingPDF ? "Экспорт..." : "PDF"}
          </Button>
        </Box>
      </Box>

      {/* Превью резюме */}
      <Box
        sx={{
          bgcolor: "background.default",
          p: 4,
          borderRadius: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* ВАЖНО: экспортируем именно этот блок */}
        <Box ref={captureRef} sx={{ width: "fit-content" }}>
          {TemplateComponent}
        </Box>
      </Box>

      {/* Информация */}
      <Box sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="caption">
          Шаблон: {resume.template} | Последнее изменение:{" "}
          {new Date(resume.updated_at).toLocaleString("ru-RU")}
        </Typography>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
