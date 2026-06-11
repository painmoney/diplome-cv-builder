import { useState } from "react";
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

function getRegisterErrorMessage(error) {
  if (!error) return "";

  const message = String(error.message || "").toLowerCase();
  const code = String(error.code || "").toLowerCase();
  const status = error.status;

  if (
    message.includes("email address") &&
    message.includes("is invalid")
  ) {
    return "Некорректный email. Проверьте адрес почты и попробуйте ещё раз.";
  }

  if (
    message.includes("invalid email") ||
    code === "validation_failed"
  ) {
    return "Некорректный email. Проверьте адрес почты и попробуйте ещё раз.";
  }

  if (
    message.includes("already registered") ||
    message.includes("user already registered") ||
    code === "user_already_exists"
  ) {
    return "Этот email уже зарегистрирован. Попробуйте войти в аккаунт.";
  }

  if (
    message.includes("password") &&
    (message.includes("6") || message.includes("short"))
  ) {
    return "Пароль слишком короткий. Укажите пароль минимум из 6 символов.";
  }

  if (status === 429 || code === "over_request_rate_limit") {
    return "Слишком много попыток регистрации. Попробуйте позже.";
  }

  if (status >= 500) {
    return "Сервис регистрации временно недоступен. Попробуйте позже.";
  }

  return "Не удалось зарегистрироваться. Проверьте данные и попробуйте ещё раз.";
}

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
    e.preventDefault();

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });

      setLoading(false);

      if (error) {
        setSnackbar({
          open: true,
          message: getRegisterErrorMessage(error),
          severity: "error",
        });
        return;
      }

      setSnackbar({
        open: true,
        message: "Проверьте почту для подтверждения регистрации!",
        severity: "success",
      });

      setTimeout(() => navigate("/login"), 2500);
    } catch {
      setLoading(false);
      setSnackbar({
        open: true,
        message: "Ошибка сети. Проверьте подключение к интернету.",
        severity: "error",
      });
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

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
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