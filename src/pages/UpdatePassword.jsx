import React, { useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Stack,
} from "@mui/material";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов.");
      return;
    }

    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      console.error("Ошибка обновления пароля:", error);
      setError("Не удалось обновить пароль. Попробуйте запросить ссылку снова.");
    } else {
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Новый пароль
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Придумайте новый пароль для аккаунта
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Новый пароль"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Минимум 6 символов"
          />

          <TextField
            label="Подтвердите пароль"
            type="password"
            fullWidth
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? "Сохраняем..." : "Сохранить пароль"}
          </Button>

          <Button variant="text" fullWidth onClick={() => navigate("/login")}>
            Вернуться ко входу
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}