import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
} from "@mui/material";
import {
  Edit,
  GetApp,
  ArrowBack,
  Description,
  Image as ImageIcon,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabaseClient";

import MinimalistTemplate from "../components/templates/MinimalistTemplate";
import AcademicTemplate from "../components/templates/AcademicTemplate";
import GithubTemplate from "../components/templates/GithubTemplate";

import { exportToPDF } from "../components/export/ExportPDF";
import { exportToMarkdown } from "../components/export/ExportMarkdown";

import html2canvas from "html2canvas";

const VALID_TEMPLATES = ["minimalist", "academic", "github"];

export default function ResumePreview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const templateParam = String(searchParams.get("template") || "").toLowerCase();
  const templateOverride = VALID_TEMPLATES.includes(templateParam) ? templateParam : null;

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState("minimalist");

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingMD, setExportingMD] = useState(false);
  const [exportingIMG, setExportingIMG] = useState(null); // "png" | "jpg" | null

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const captureRef = useRef(null);
  const appliedOverrideRef = useRef("");

  useEffect(() => {
    if (!user) return;
    loadResume();
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
      setLoading(false);
      return;
    }

    if (data) {
      setResume(data);

      const current =
        String(data.template || data.data?.template || "minimalist").toLowerCase();
      setSelectedTemplate(
        templateOverride || (VALID_TEMPLATES.includes(current) ? current : "minimalist")
      );
    } else {
      // если резюме нет — отправим в редактор
      setSnackbar({
        open: true,
        message: "Резюме не найдено. Создайте его в редакторе.",
        severity: "info",
      });
      setTimeout(() => navigate("/resume-editor"), 300);
    }

    setLoading(false);
  };

  // ✅ применяем override один раз (после загрузки резюме)
  useEffect(() => {
    if (!templateOverride) return;
    if (!resume?.id) return;

    const key = `${resume.id}:${templateOverride}`;
    if (appliedOverrideRef.current === key) return;
    appliedOverrideRef.current = key;

    setSelectedTemplate(templateOverride);

    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        template: templateOverride,
        data: { ...(prev.data || {}), template: templateOverride },
      };
    });
  }, [templateOverride, resume?.id]);

  const TemplateComponent = useMemo(() => {
    switch (selectedTemplate) {
      case "academic":
        return AcademicTemplate;
      case "github":
        return GithubTemplate;
      default:
        return MinimalistTemplate;
    }
  }, [selectedTemplate]);

  const handleTemplateChange = async (_, value) => {
    if (!value) return;
    setSelectedTemplate(value);

    // обновляем локально для экспорта/рендера
    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        template: value,
        data: { ...(prev.data || {}), template: value },
      };
    });

    // (опционально) сохраняем выбор в БД
    if (resume?.id && user?.id) {
      try {
        await supabase
          .from("resumes")
          .update({ template: value, data: { ...(resume.data || {}), template: value } })
          .eq("id", resume.id)
          .eq("user_id", user.id);
      } catch {
        // игнор — это только удобство, не критично
      }
    }
  };

  const handleExportPDF = async () => {
    if (!resume) return;
    setExportingPDF(true);
    try {
      const result = await exportToPDF(resume.data, selectedTemplate);
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
    return String(name || "resume")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, "_")
      .trim() || "resume";
  };

  const handleExportImage = async (fmt) => {
    if (!captureRef.current || !resume) return;

    setExportingIMG(fmt);
    try {
      await document.fonts?.ready;

      const canvas = await html2canvas(captureRef.current, {
        scale: Math.max(2, window.devicePixelRatio || 2),
        useCORS: true,
        backgroundColor: null,
        logging: false,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
      });

      const mime = fmt === "jpg" ? "image/jpeg" : "image/png";
      const quality = fmt === "jpg" ? 0.92 : 1;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setSnackbar({
              open: true,
              message: "Не удалось сформировать изображение",
              severity: "error",
            });
            return;
          }
          const name = sanitizeFileName(resume.data?.profile?.name);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${name}_${Date.now()}.${fmt}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);

          setSnackbar({
            open: true,
            message: `Экспорт ${fmt.toUpperCase()} завершён`,
            severity: "success",
          });
        },
        mime,
        quality
      );
    } catch (e) {
      const msg = String(e?.message || e);
      const corsLikely = msg.toLowerCase().includes("tainted") || msg.toLowerCase().includes("cors");
      setSnackbar({
        open: true,
        message: corsLikely
          ? "Экспорт изображения заблокирован из-за CORS. Используйте PDF."
          : "Ошибка при экспорте изображения",
        severity: "error",
      });
    } finally {
      setExportingIMG(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!resume) {
    return (
      <Box sx={{ py: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Резюме не найдено
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Перейдите в редактор и создайте резюме.
        </Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/resume-editor")}>
          Открыть редактор
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Toolbar */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/dashboard")}
          >
            Назад
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate("/resume-editor")}
          >
            Редактировать
          </Button>
        </Stack>

        <ToggleButtonGroup
          value={selectedTemplate}
          exclusive
          onChange={handleTemplateChange}
          size="small"
        >
          <ToggleButton value="minimalist">Minimalist</ToggleButton>
          <ToggleButton value="academic">Academic</ToggleButton>
          <ToggleButton value="github">GitHub</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<GetApp />}
            disabled={exportingPDF || exportingMD || exportingIMG}
            onClick={handleExportPDF}
          >
            {exportingPDF ? "Экспорт..." : "PDF"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Description />}
            disabled={exportingPDF || exportingMD || exportingIMG}
            onClick={handleExportMarkdown}
          >
            {exportingMD ? "Экспорт..." : "Markdown"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            disabled={exportingPDF || exportingMD || exportingIMG}
            onClick={() => handleExportImage("png")}
          >
            {exportingIMG === "png" ? "Экспорт..." : "PNG"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            disabled={exportingPDF || exportingMD || exportingIMG}
            onClick={() => handleExportImage("jpg")}
          >
            {exportingIMG === "jpg" ? "Экспорт..." : "JPG"}
          </Button>
        </Stack>
      </Stack>

      {/* Preview */}
      <Box
        ref={captureRef}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <TemplateComponent data={resume.data} />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
