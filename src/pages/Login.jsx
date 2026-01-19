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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error("Ошибка входа:", error.message);
      setError(error.message);
    } else {
      console.log("Успешный вход:", data);
      navigate("/dashboard");
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

          <Button variant="text" fullWidth onClick={() => navigate("/register")}>
            Нет аккаунта? Зарегистрироваться
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
