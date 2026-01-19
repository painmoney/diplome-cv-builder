import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Snackbar,
  Alert,
  Paper,
  Stack,
} from "@mui/material";
import { supabase } from "../api/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleRegister = async (e) => {
    e?.preventDefault?.();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        setSnackbar({
          open: true,
          message: "Этот email уже зарегистрирован. Войдите через Login.",
          severity: "error",
        });
      } else {
        setSnackbar({ open: true, message: error.message, severity: "error" });
      }
    } else {
      setSnackbar({
        open: true,
        message: "✅ Проверьте почту для подтверждения регистрации!",
        severity: "success",
      });
      setTimeout(() => navigate("/login"), 2500);
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
        Регистрация
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Создайте аккаунт, чтобы сохранять резюме и экспортировать PDF/Markdown/PNG
      </Typography>

      <Box component="form" onSubmit={handleRegister}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            fullWidth
            label="Пароль"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Минимум 6 символов"
          />

          <Button variant="contained" fullWidth onClick={handleRegister} disabled={loading}>
            {loading ? "Создаём..." : "Зарегистрироваться"}
          </Button>

          <Button variant="text" fullWidth onClick={() => navigate("/login")}>
            Уже есть аккаунт? Войти
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
