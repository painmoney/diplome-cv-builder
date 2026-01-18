// src/components/profile/ProfileForm.jsx — ЗАМЕНИ ПОЛНОСТЬЮ
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Avatar, TextField, Snackbar, Alert } from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { uploadAvatar, getAvatarUrl } from "../../api/storage";

export default function ProfileForm({ data = {}, onChange }) {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(data.photo || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      const url = getAvatarUrl(user.id);
      setAvatarUrl(url);
      if (!data.photo) {
        onChange({ ...data, photo: url });
      }
    }
  }, [user]);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setSnackbar({ open: true, message: 'Выберите файл!', severity: 'warning' });
      return;
    }
    
    setUploading(true);
    try {
      await uploadAvatar(user.id, avatarFile);
      const url = getAvatarUrl(user.id);
      setAvatarUrl(`${url}?t=${Date.now()}`); // кэш-бастер
      handleChange('photo', url);
      setAvatarFile(null);
      setSnackbar({ open: true, message: '✅ Аватар загружен!', severity: 'success' });
    } catch (err) {
      console.error('Upload error:', err);
      setSnackbar({ open: true, message: `Ошибка: ${err.message}`, severity: 'error' });
    }
    setUploading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Личные данные</Typography>
      
      {/* Аватар */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar
          src={avatarUrl}
          sx={{ width: 100, height: 100 }}
        >
          {!avatarUrl && data.name?.[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="avatar-upload-input"
            type="file"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  setSnackbar({ open: true, message: 'Файл больше 5MB!', severity: 'error' });
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
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </Button>
          )}
          {avatarFile && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {avatarFile.name}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Текстовые поля */}
      <TextField
        label="Имя Фамилия"
        value={data.name || ''}
        onChange={(e) => handleChange('name', e.target.value)}
        fullWidth
        margin="normal"
        placeholder="Иван Иванов"
      />
      <TextField
        label="О себе (краткое резюме)"
        value={data.summary || ''}
        onChange={(e) => handleChange('summary', e.target.value)}
        fullWidth
        multiline
        rows={4}
        margin="normal"
        placeholder="Fullstack разработчик с 3 годами опыта в React, Node.js, PostgreSQL..."
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
