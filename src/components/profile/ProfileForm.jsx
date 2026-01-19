import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Avatar, TextField, Snackbar, Alert } from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { uploadAvatar, getAvatarUrl } from "../../api/storage";

export default function ProfileForm({ data = {}, errors = {}, onChange }) {
  const { user } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState(data.photo || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Приоритетное поле для "О себе": about, но поддерживаем summary (legacy)
  const aboutValue = data.about ?? data.summary ?? "";

  useEffect(() => {
    if (!user) return;

    const url = getAvatarUrl(user.id);
    setAvatarUrl(url);

    if (!data.photo) {
      onChange({ ...data, photo: url });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleChange = (field, value) => {
    const next = { ...data, [field]: value };

    // мост about <-> summary
    if (field === "about") next.summary = value;
    if (field === "summary") next.about = value;

    onChange(next);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setSnackbar({ open: true, message: "Выберите файл!", severity: "warning" });
      return;
    }

    setUploading(true);
    try {
      await uploadAvatar(user.id, avatarFile);
      const url = getAvatarUrl(user.id);
      setAvatarUrl(`${url}?t=${Date.now()}`); // cache-buster
      handleChange("photo", url);
      setAvatarFile(null);
      setSnackbar({ open: true, message: "✅ Аватар загружен!", severity: "success" });
    } catch (err) {
      console.error("Upload error:", err);
      setSnackbar({ open: true, message: `Ошибка: ${err.message}`, severity: "error" });
    }
    setUploading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Личные данные
      </Typography>

      {/* Аватар */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar src={avatarUrl} sx={{ width: 100, height: 100 }}>
          {!avatarUrl && data.name?.[0]?.toUpperCase()}
        </Avatar>

        <Box>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="avatar-upload-input"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  setSnackbar({ open: true, message: "Файл больше 5MB!", severity: "error" });
                  return;
                }
                setAvatarFile(file);
              }
            }}
          />

          <label htmlFor="avatar-upload-input">
            <Button variant="outlined" component="span" startIcon={<PhotoCamera />}>
              Выбрать фото
            </Button>
          </label>

          {avatarFile && (
            <Button
              variant="contained"
              onClick={handleAvatarUpload}
              disabled={uploading}
              sx={{ ml: 2 }}
            >
              {uploading ? "Загрузка..." : "Загрузить"}
            </Button>
          )}

          {avatarFile && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {avatarFile.name}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Поля (✅ id совпадают с recommendationLogic targets) */}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
