import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Avatar,
  Grid,
  Chip,
  Snackbar,
  Alert,
  LinearProgress,
  Stack,
} from "@mui/material";
import {
  Edit,
  Visibility,
  GetApp,
  Description,
  PictureAsPdf,
  Article,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabaseClient";
import { getAvatarUrl } from "../api/storage";
import { getResumeCompleteness } from "../utils/helpers";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingDOCX, setExportingDOCX] = useState(false);
  const [exportingMD, setExportingMD] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const loadResume = async (userId) => {
    setLoadingResume(true);

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setSnackbar({
        open: true,
        message: `Ошибка загрузки резюме: ${error.message}`,
        severity: "error",
      });
      setLoadingResume(false);
      return;
    }

    setResume(data || null);
    setLoadingResume(false);
  };

  useEffect(() => {
    if (!user?.id) return;

    loadResume(user.id); // eslint-disable-line react-hooks/set-state-in-effect -- data fetch on mount
    setAvatarUrl(getAvatarUrl(user.id));
  }, [user?.id]);

  const handleExportPDF = async () => {
    if (!resume) {
      setSnackbar({
        open: true,
        message: "Сначала создайте резюме",
        severity: "warning",
      });
      return;
    }

    setExportingPDF(true);

    try {
      const { exportToPDF } = await import("../components/export/ExportPDF.jsx");
      const result = await exportToPDF(resume.data, resume.template);

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
    if (!resume) {
      setSnackbar({
        open: true,
        message: "Сначала создайте резюме",
        severity: "warning",
      });
      return;
    }

    setExportingDOCX(true);

    try {
      const { exportToDocx } = await import("../components/export/ExportDocx");
      const result = await exportToDocx(resume.data, resume.template);

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
    if (!resume) {
      setSnackbar({
        open: true,
        message: "Сначала создайте резюме",
        severity: "warning",
      });
      return;
    }

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

  const disabled = loadingResume || exportingPDF || exportingMD || exportingDOCX;
  const profileName = resume?.data?.profile?.name || "";
  const userInitial = user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Container sx={{ mt: 4, maxWidth: 900 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Avatar
          src={avatarUrl || ""}
          imgProps={{ alt: "Аватар пользователя" }}
          sx={{ width: 80, height: 80 }}
        >
          {profileName?.[0]?.toUpperCase() || userInitial}
        </Avatar>

        <Box>
          <Typography variant="h4" component="h1">
            {profileName || "Добро пожаловать!"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      </Box>

      {/* Карточка резюме */}
      {loadingResume ? (
        <Card sx={{ mb: 3, textAlign: "center", p: 4, minHeight: 220 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Загрузка резюме...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Получение данных из Supabase
          </Typography>
        </Card>
      ) : resume ? (
        <Card sx={{ mb: 3, minHeight: 220 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="h6" component="h2">
                {resume.title}
              </Typography>
              <Chip
                label={`Шаблон: ${resume.template}`}
                color="primary"
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Обновлено: {new Date(resume.updated_at).toLocaleDateString("ru-RU")}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Навыки
                </Typography>
                <Typography variant="h6" component="p">
                  {resume.data?.skills?.length || 0}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Образование
                </Typography>
                <Typography variant="h6" component="p">
                  {resume.data?.education?.length || 0}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  Опыт
                </Typography>
                <Typography variant="h6" component="p">
                  {resume.data?.experience?.length || 0}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  GitHub
                </Typography>
                <Typography variant="h6" component="p">
                  {resume.data?.github?.length || 0}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate("/resume-editor")}
                disabled={disabled}
              >
                Редактировать
              </Button>

              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => navigate("/resume-preview")}
                disabled={disabled}
              >
                Просмотр
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
                variant="outlined"
                startIcon={<Description />}
                onClick={handleExportDocx}
                disabled={disabled}
              >
                {exportingDOCX ? "Экспорт..." : "Скачать DOCX"}
              </Button>

              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={handleExportPDF}
                disabled={disabled}
              >
                {exportingPDF ? "Экспорт..." : "Скачать PDF"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3, textAlign: "center", p: 4, minHeight: 220 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Резюме ещё не создано
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Создайте своё первое IT-резюме прямо сейчас
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/resume-editor")}
          >
            Создать резюме
          </Button>
        </Card>
      )}

      {/* Заполненность резюме */}
      {resume && (() => {
        const c = getResumeCompleteness(resume.data);
        const statusColors = { low: "error", medium: "warning", high: "success", complete: "success" };
        const statusLabels = { low: "Начните заполнять", medium: "Есть над чем поработать", high: "Почти готово", complete: "Отлично!" };

        return (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h6" component="h2">
                  Заполненность резюме
                </Typography>
                <Chip
                  size="small"
                  label={`${statusLabels[c.status]} · ${c.score}%`}
                  color={statusColors[c.status]}
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={c.score}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  bgcolor: "action.hover",
                  mb: 2,
                  "& .MuiLinearProgress-bar": { borderRadius: 999 },
                }}
              />

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
                {c.sections.map((s) => (
                  <Chip
                    key={s.key}
                    size="small"
                    label={s.label}
                    color={s.completed ? "success" : "warning"}
                    variant={s.completed ? "filled" : "outlined"}
                    title={s.helperText}
                  />
                ))}
              </Stack>

              <Button
                variant="contained"
                size="small"
                onClick={() => navigate("/resume-editor")}
                disabled={disabled}
              >
                Продолжить редактирование
              </Button>
            </CardContent>
          </Card>
        );
      })()}

      {/* Быстрые действия */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        Быстрые действия
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card
            sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}
            onClick={() => navigate("/resume-editor")}
          >
            <CardContent>
              <Edit color="primary" sx={{ mb: 1 }} />
              <Typography variant="h6" component="h3">
                Редактор резюме
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Добавьте навыки, опыт и проекты
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card
            sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}
            onClick={handleExportPDF}
          >
            <CardContent>
              <PictureAsPdf color="primary" sx={{ mb: 1 }} />
              <Typography variant="h6" component="h3">
                Экспорт в PDF
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Скачайте готовое резюме
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card
            sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}
            onClick={handleExportMarkdown}
          >
            <CardContent>
              <Description color="primary" sx={{ mb: 1 }} />
              <Typography variant="h6" component="h3">
                Экспорт в Markdown
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Для GitHub / GitLab / README.md
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card
            sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}
            onClick={handleExportDocx}
          >
            <CardContent>
              <Article color="primary" sx={{ mb: 1 }} />
              <Typography variant="h6" component="h3">
                Экспорт в DOCX
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Для редактирования в Microsoft Word
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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