import { useState } from "react";
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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      setLoading(false);

      if (error) {
        setError("Не удалось отправить ссылку. Проверьте email и попробуйте ещё раз.");
      } else {
        setSuccess(true);
      }
    } catch {
      setLoading(false);
      setError("Ошибка сети. Проверьте подключение к интернету.");
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 640, mx: "auto" }}>
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
          Восстановление пароля
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Укажите email, и мы отправим ссылку для сброса пароля
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Ссылка для сброса пароля отправлена на {email}. Проверьте почту.
            </Alert>
            <Button variant="text" fullWidth onClick={() => navigate("/login")}>
              Вернуться ко входу
            </Button>
          </>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? "Отправляем..." : "Отправить ссылку"}
              </Button>

              <Button variant="text" fullWidth onClick={() => navigate("/login")}>
                Вернуться ко входу
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
}