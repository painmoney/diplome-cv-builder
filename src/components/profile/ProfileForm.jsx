
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import AutoFixHigh from "@mui/icons-material/AutoFixHigh";
import { useAuth } from "../../context/AuthContext";
import AvatarUpload from "./AvatarUpload";
import { isAIAvailable, generateAboutMe } from "../../utils/aiService";

export default function ProfileForm({ data = {}, errors = {}, onChange, skills = [], experience = [], github = [] }) {
  const { user } = useAuth();

  const aboutValue = data.about ?? data.summary ?? "";

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiPreviewText, setAiPreviewText] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);

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

  const handleChange = (field, value) => {
    const next = { ...data, [field]: value };
    if (field === "about") next.summary = value;
    if (field === "summary") next.about = value;
    onChange(next);
  };

  const handleGenerateAbout = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const text = await generateAboutMe({
        name: data.name || "",
        about: aboutValue,
        skills,
        experience,
        github,
      });
      setAiPreviewText(text);
      setAiPreviewOpen(true);
    } catch (err) {
      setAiError(err.message || "Ошибка AI-сервиса");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAI = () => {
    handleChange("about", aiPreviewText);
    setAiPreviewOpen(false);
    setAiPreviewText("");
  };

  const handleCancelAI = () => {
    setAiPreviewOpen(false);
    setAiPreviewText("");
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom>
        Личные данные
      </Typography>

      <AvatarUpload
        userId={user?.id}
        avatarUrl={data.photo || ""}
        displayName={data.name || ""}
        disabled={!user?.id}
        onAvatarChange={(url) => handleChange("photo", url)}
      />

      <TextField
        id="profile-name"
        label="ФИО"
        value={data.name || ""}
        onChange={(e) => handleChange("name", e.target.value)}
        fullWidth
        margin="normal"
        placeholder="Иван Иванов"
        error={Boolean(errors.name)}
        helperText={errors.name || " "}
      />

      <TextField
        id="profile-email"
        label="Email"
        value={data.email || ""}
        onChange={(e) => handleChange("email", e.target.value)}
        fullWidth
        margin="normal"
        placeholder="ivan.ivanov@example.com"
        error={Boolean(errors.email)}
        helperText={errors.email || " "}
      />

      <TextField
        id="profile-phone"
        label="Телефон"
        value={data.phone || ""}
        onChange={(e) => handleChange("phone", e.target.value)}
        fullWidth
        margin="normal"
        placeholder="+7 (900) 123-45-67"
        error={Boolean(errors.phone)}
        helperText={errors.phone || " "}
      />

      <TextField
        id="profile-about"
        label="О себе (краткое резюме)"
        value={aboutValue}
        onChange={(e) => handleChange("about", e.target.value)}
        fullWidth
        multiline
        rows={4}
        margin="normal"
        placeholder="Frontend/Fullstack разработчик... Стек... Достижения..."
        error={Boolean(errors.about)}
        helperText={errors.about || " "}
      />

      {aiAvailable && (
        <Box sx={{ mt: -0.5, mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={handleGenerateAbout}
            disabled={aiLoading}
            startIcon={aiLoading ? <CircularProgress size={16} /> : <AutoFixHigh />}
          >
            {aiLoading
              ? "AI генерирует..."
              : aboutValue.trim()
                ? "AI Улучшить О себе"
                : "AI Сгенерировать О себе"}
          </Button>
        </Box>
      )}

      {aiAvailable && !aboutValue.trim() && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -0.5, mb: 1 }}>
          AI генерирует текст на основе навыков, опыта и проектов из резюме.
          Проверьте результат перед сохранением. Использует лимиты Puter-аккаунта.
        </Typography>
      )}

      {aiAvailable && (skills.length < 3 || experience.length === 0) && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Заполните навыки и опыт для более точной генерации.
        </Alert>
      )}

      {aiError && (
        <Alert severity="warning" sx={{ mb: 1 }} onClose={() => setAiError("")}>
          {aiError}
        </Alert>
      )}

      <Dialog
        open={aiPreviewOpen}
        onClose={handleCancelAI}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>О себе (AI)</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Проверьте текст. Нажмите «Применить», чтобы подставить в поле «О себе».
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
