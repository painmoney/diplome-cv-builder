import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import {
  Edit,
  GetApp,
  Description,
  Image as ImageIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loadResumeById, loadUserResume } from "../api/resumeService";

import { TEMPLATE_IDS, TEMPLATE_REGISTRY } from "../utils/templateRegistry";
import MinimalistTemplate from "../components/templates/MinimalistTemplate";
import AcademicTemplate from "../components/templates/AcademicTemplate";
import GithubTemplate from "../components/templates/GithubTemplate";
import ClassicTemplate from "../components/templates/ClassicTemplate";
import ModernTemplate from "../components/templates/ModernTemplate";

import html2canvas from "html2canvas";
import ExportProgressBackdrop from "../components/export/ExportProgressBackdrop";

const VALID_TEMPLATES = TEMPLATE_IDS;

const PREVIEW_TEMPLATE_COMPONENTS = {
  minimalist: MinimalistTemplate,
  academic: AcademicTemplate,
  github: GithubTemplate,
  classic: ClassicTemplate,
  modern: ModernTemplate,
};

export default function ResumePreview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resumeId: routeResumeId } = useParams();

  const templateParam = String(searchParams.get("template") || "").toLowerCase();
  const templateOverride = VALID_TEMPLATES.includes(templateParam) ? templateParam : null;

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadGenerationRef = useRef(0);

  const [selectedTemplate, setSelectedTemplate] = useState("minimalist");

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingMD, setExportingMD] = useState(false);
  const [exportingDOCX, setExportingDOCX] = useState(false);
  const [exportingIMG, setExportingIMG] = useState(null); // "png" | "jpg" | null
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const captureRef = useRef(null);
  const appliedOverrideRef = useRef("");

  const loadResume = async (resumeIdParam) => {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setNotFound(false);
    setLoadError("");

    try {
      let data;

      if (resumeIdParam) {
        const loaded = await loadResumeById(resumeIdParam);
        if (generation !== loadGenerationRef.current) return;

        if (!loaded) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        data = {
          id: loaded.resumeId,
          user_id: loaded.userId,
          title: loaded.title,
          template: loaded.template,
          revision: loaded.revision,
          data: loaded.data,
          created_at: loaded.createdAt,
          updated_at: loaded.updatedAt,
        };
      } else {
        const loaded = await loadUserResume(user.id);
        if (generation !== loadGenerationRef.current) return;

        if (!loaded) {
          setSnackbar({
            open: true,
            message: "Резюме не найдено. Создайте его в редакторе.",
            severity: "info",
          });
          setTimeout(() => navigate("/dashboard"), 300);
          setLoading(false);
          return;
        }
        data = {
          id: loaded.id,
          user_id: loaded.user_id,
          title: loaded.title,
          template: loaded.template,
          revision: loaded.revision,
          data: loaded.data,
          created_at: loaded.created_at,
          updated_at: loaded.updated_at,
        };
      }

      if (data) {
        setResume(data);
        const current =
          String(data.template || data.data?.template || "minimalist").toLowerCase();
        setSelectedTemplate(
          templateOverride || (VALID_TEMPLATES.includes(current) ? current : "minimalist")
        );
      } else if (!resumeIdParam) {
        setSnackbar({
          open: true,
          message: "Резюме не найдено. Создайте его в редакторе.",
          severity: "info",
        });
        setTimeout(() => navigate("/dashboard"), 300);
      }
    } catch {
      if (generation !== loadGenerationRef.current) return;
      setLoadError("Не удалось загрузить резюме. Попробуйте обновить страницу.");
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    loadResume(routeResumeId || null); // eslint-disable-line react-hooks/set-state-in-effect -- data fetch on mount/route change
  }, [user, routeResumeId]); // eslint-disable-line react-hooks/exhaustive-deps -- loadResume is stable

  // применяем override один раз (после загрузки резюме)
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

  const TemplateComponent = PREVIEW_TEMPLATE_COMPONENTS[selectedTemplate] || MinimalistTemplate;

  const handleTemplateChange = async (_, value) => {
    if (!value) return;
    setSelectedTemplate(value);

    // Local-only: update preview state for export/render.
    // Persistence happens only via ResumeEditor save queue.
    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        template: value,
        data: { ...(prev.data || {}), template: value },
      };
    });
  };

  const handleExportPDF = async () => {
    if (!resume) return;
    setExportingPDF(true);
    try {
      const { exportToPDF } = await import("../components/export/ExportPDF");
      const result = await exportToPDF(resume.data, selectedTemplate);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Ошибка при экспорте PDF",
        severity: "error",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportDocx = async () => {
    if (!resume) return;
    setExportingDOCX(true);
    try {
      const { exportToDocx } = await import("../components/export/ExportDocx");
      const result = await exportToDocx(resume.data, selectedTemplate);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Ошибка при экспорте DOCX",
        severity: "error",
      });
    } finally {
      setExportingDOCX(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!resume) return;
    setExportingMD(true);
    try {
      const { exportToMarkdown } = await import("../components/export/ExportMarkdown");
      const result = await exportToMarkdown(resume.data);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? "success" : "error",
      });
    } catch {
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
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
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

  if (loadError) {
    return (
      <Box sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>
        <Button variant="contained" onClick={() => navigate("/dashboard")}>
          На главную
        </Button>
      </Box>
    );
  }

  if (notFound || !resume) {
    return (
      <Box sx={{ py: 6 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Резюме не найдено или у вас нет доступа к нему.
        </Alert>
        <Button variant="contained" onClick={() => navigate("/dashboard")}>
          На главную
        </Button>
      </Box>
    );
  }

  const editorPath = routeResumeId ? `/resume-editor/${routeResumeId}` : "/dashboard";

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
            startIcon={<Edit />}
            onClick={() => navigate(editorPath)}
          >
            Вернуться к редактированию
          </Button>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          endIcon={<ExpandMoreIcon />}
          onClick={(e) => setTemplateMenuAnchor(e.currentTarget)}
          sx={{ minWidth: 180, textTransform: "none" }}
        >
          {TEMPLATE_REGISTRY[selectedTemplate]?.label || "Шаблон"}
        </Button>
        <Menu
          anchorEl={templateMenuAnchor}
          open={Boolean(templateMenuAnchor)}
          onClose={() => setTemplateMenuAnchor(null)}
        >
          {Object.values(TEMPLATE_REGISTRY).map((tpl) => (
            <MenuItem
              key={tpl.id}
              selected={tpl.id === selectedTemplate}
              onClick={() => {
                handleTemplateChange(null, tpl.id);
                setTemplateMenuAnchor(null);
              }}
            >
              {tpl.label}
            </MenuItem>
          ))}
        </Menu>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<GetApp />}
            disabled={exportingPDF || exportingMD || exportingDOCX || exportingIMG}
            onClick={handleExportPDF}
          >
            {exportingPDF ? "Сохранение..." : "Скачать PDF"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Description />}
            disabled={exportingPDF || exportingMD || exportingDOCX || exportingIMG}
            onClick={handleExportMarkdown}
          >
            {exportingMD ? "Сохранение..." : "Скачать Markdown"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Description />}
            disabled={exportingPDF || exportingMD || exportingDOCX || exportingIMG}
            onClick={handleExportDocx}
          >
            {exportingDOCX ? "Сохранение..." : "Скачать DOCX"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            disabled={exportingPDF || exportingMD || exportingDOCX || exportingIMG}
            onClick={() => handleExportImage("png")}
          >
            {exportingIMG === "png" ? "Сохранение..." : "Скачать PNG"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            disabled={exportingPDF || exportingMD || exportingDOCX || exportingIMG}
            onClick={() => handleExportImage("jpg")}
          >
            {exportingIMG === "jpg" ? "Сохранение..." : "Скачать JPG"}
          </Button>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        PDF — для отправки работодателю • DOCX — для редактирования вручную • Markdown — для GitHub/портфолио
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Перед скачиванием проверьте:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, mt: 0.5 }}>
          <li>контакты и email</li>
          <li>опыт и проекты</li>
          <li>выбранный шаблон</li>
        </Typography>
      </Alert>

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

      {/* Backdrop экспорта */}
      <ExportProgressBackdrop
        open={!!exportingPDF || !!exportingDOCX || !!exportingIMG}
        format={exportingPDF ? "PDF" : exportingDOCX ? "DOCX" : exportingIMG?.toUpperCase() || "PDF"}
      />

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
