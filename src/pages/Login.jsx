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

function getAuthErrorMessage(error) {
  if (!error) return "";

  const message = String(error.message || "").toLowerCase();
  const code = String(error.code || "").toLowerCase();
  const status = error.status;

  if (
    message.includes("email not confirmed") ||
    code === "email_not_confirmed"
  ) {
    return "Email ещё не подтверждён. Проверьте почту и перейдите по ссылке подтверждения.";
  }

  if (
    message.includes("invalid login credentials") ||
    code === "invalid_credentials"
  ) {
    return "Неверный email или пароль. Если аккаунта ещё нет, зарегистрируйтесь.";
  }

  if (status === 429 || code === "over_request_rate_limit") {
    return "Слишком много попыток входа. Попробуйте позже.";
  }

  return "Не удалось войти. Проверьте данные и попробуйте ещё раз.";
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setError(getAuthErrorMessage(error));
      } else {
        navigate("/dashboard");
      }
    } catch {
      setLoading(false);
      setError("Ошибка сети. Проверьте подключение к интернету.");
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
        Вход
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Войдите, чтобы редактировать резюме и экспортировать файлы
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleLogin}>
        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Пароль"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Button variant="text" size="small" onClick={() => navigate("/forgot-password")}>
              Забыли пароль?
            </Button>
          </Box>

          <Button variant="text" fullWidth onClick={() => navigate("/register")}>
            Нет аккаунта? Зарегистрироваться
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}