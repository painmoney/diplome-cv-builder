import { useEffect, useState, useRef, useCallback } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Grid,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from "@mui/material";
import {
  Edit,
  Visibility,
  ContentCopy,
  Delete,
  MoreVert,
  Add,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  listUserResumes,
  loadAccountProfile,
  createNewResume,
  renameResumeById,
  duplicateResumeById,
  deleteResumeById,
} from "../api/resumeService";
import { getAvatarUrl } from "../api/storage";

const TEMPLATE_LABELS = {
  minimalist: "Минималистичный",
  academic: "Академический",
  github: "GitHub-стиль",
  classic: "Классический ATS",
  modern: "Современный IT",
};

function ResumeCard({ resume, onRename, onDuplicate, onDelete }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Card
      variant="outlined"
      sx={{
        transition: "transform 150ms ease, box-shadow 150ms ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="h6" component="h3" noWrap sx={{ flex: 1, minWidth: 0 }}>
            {resume.title}
          </Typography>
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setAnchorEl(null); onRename(resume); }}>
              Переименовать
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); onDuplicate(resume); }}>
              <ContentCopy fontSize="small" sx={{ mr: 1 }} /> Создать копию
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); onDelete(resume); }} sx={{ color: "error.main" }}>
              <Delete fontSize="small" sx={{ mr: 1 }} /> Удалить
            </MenuItem>
          </Menu>
        </Box>

        <Chip
          label={TEMPLATE_LABELS[resume.template] || resume.template}
          size="small"
          sx={{ mb: 1.5 }}
        />

        <Typography variant="body2" color="text.secondary">
          Обновлено: {new Date(resume.updatedAt).toLocaleDateString("ru-RU")}
        </Typography>
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 2, py: 1 }}>
        <Button
          size="small"
          startIcon={<Edit />}
          onClick={() => navigate(`/resume-editor/${resume.resumeId}`)}
        >
          Редактировать
        </Button>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => navigate(`/resume-preview/${resume.resumeId}`)}
        >
          Просмотр
        </Button>
      </CardActions>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const loadGenerationRef = useRef(0);

  const [resumes, setResumes] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const [duplicateId, setDuplicateId] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const loadResumes = useCallback(async () => {
    if (!userId) return;
    const gen = ++loadGenerationRef.current;
    setLoading(true);
    setError("");
    try {
      const [list, accountProfile] = await Promise.all([
        listUserResumes(userId),
        loadAccountProfile(userId),
      ]);
      if (gen !== loadGenerationRef.current) return;
      setResumes(list);
      setAvatarUrl(
        accountProfile?.photo || `${getAvatarUrl(userId)}?v=${Date.now()}`
      );
    } catch {
      if (gen !== loadGenerationRef.current) return;
      setError("Не удалось загрузить резюме. Попробуйте обновить страницу.");
    } finally {
      if (gen === loadGenerationRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadResumes(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetch on mount
  }, [loadResumes]);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const result = await createNewResume({ userId: user.id });
      navigate(`/resume-editor/${result.resumeId}`);
    } catch {
      setSnackbar({ open: true, message: "Не удалось создать резюме. Попробуйте ещё раз.", severity: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleRename = (resume) => {
    setRenameTarget(resume);
    setRenameValue(resume.title);
    setRenameOpen(true);
  };

  const handleRenameSave = async () => {
    if (!renameTarget || renameSaving) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === renameTarget.title) {
      setRenameOpen(false);
      return;
    }
    setRenameSaving(true);
    try {
      await renameResumeById(renameTarget.resumeId, trimmed);
      setSnackbar({ open: true, message: "Название резюме изменено", severity: "success" });
      setRenameOpen(false);
      await loadResumes();
    } catch (err) {
      const code = err?.code;
      if (code === "P1005") {
        setSnackbar({ open: true, message: "Резюме было изменено в другом окне. Список обновлён.", severity: "warning" });
        setRenameOpen(false);
        await loadResumes();
      } else if (code === "P1004") {
        setSnackbar({ open: true, message: "Резюме не найдено или у вас нет доступа к нему.", severity: "error" });
        setRenameOpen(false);
        await loadResumes();
      } else {
        setSnackbar({ open: true, message: "Не удалось переименовать резюме.", severity: "error" });
      }
    } finally {
      setRenameSaving(false);
    }
  };

  const handleDuplicate = async (resume) => {
    if (duplicateId) return;
    setDuplicateId(resume.resumeId);
    try {
      await duplicateResumeById(resume.resumeId);
      setSnackbar({ open: true, message: "Копия резюме создана", severity: "success" });
      await loadResumes();
    } catch (err) {
      if (err?.code === "P1004") {
        setSnackbar({ open: true, message: "Резюме не найдено или у вас нет доступа к нему.", severity: "error" });
      } else {
        setSnackbar({ open: true, message: "Не удалось создать копию.", severity: "error" });
      }
    } finally {
      setDuplicateId(null);
    }
  };

  const handleDelete = (resume) => {
    setDeleteTarget(resume);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteSaving) return;
    setDeleteSaving(true);
    try {
      await deleteResumeById(deleteTarget.resumeId);
      setSnackbar({ open: true, message: "Резюме удалено", severity: "success" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadResumes();
    } catch (err) {
      if (err?.code === "P1004") {
        setSnackbar({ open: true, message: "Резюме уже удалено или у вас нет доступа к нему.", severity: "warning" });
        setDeleteOpen(false);
        setDeleteTarget(null);
        await loadResumes();
      } else {
        setSnackbar({ open: true, message: "Не удалось удалить резюме.", severity: "error" });
      }
    } finally {
      setDeleteSaving(false);
    }
  };

  const userInitial = user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Container sx={{ mt: 4, maxWidth: 900 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Avatar
          src={avatarUrl}
          imgProps={{ alt: "Аватар пользователя" }}
          sx={{ width: 64, height: 64 }}
        >
          {userInitial}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1">
            Мои резюме
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={creating ? <CircularProgress size={18} /> : <Add />}
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? "Создание..." : "Создать резюме"}
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={loadResumes}>Повторить</Button>
        }>
          {error}
        </Alert>
      )}

      {!loading && !error && resumes.length === 0 && (
        <Card sx={{ textAlign: "center", p: 6 }}>
          <Typography variant="h6" gutterBottom>У вас пока нет резюме</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Создайте первое резюме и заполните его в удобном редакторе.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} disabled={creating}>
            Создать резюме
          </Button>
        </Card>
      )}

      {!loading && !error && resumes.length > 0 && (
        <Grid container spacing={2}>
          {resumes.map((r) => (
            <Grid item xs={12} sm={6} md={4} key={r.resumeId}>
              <ResumeCard
                resume={r}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Rename dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Переименовать резюме</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRenameSave(); }}
            disabled={renameSaving}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)} disabled={renameSaving}>Отмена</Button>
          <Button onClick={handleRenameSave} variant="contained" disabled={renameSaving || !renameValue.trim()}>
            {renameSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onClose={() => !deleteSaving && setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Удалить резюме</DialogTitle>
        <DialogContent>
          <Typography>
            Удалить резюме «{deleteTarget?.title}»? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteSaving}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteSaving}>
            {deleteSaving ? "Удаление..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
