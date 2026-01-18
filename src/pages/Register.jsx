import React, { useState } from "react";
import { Container, TextField, Button, Typography, Box } from "@mui/material";
import { supabase } from "../api/supabaseClient";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Проверьте почту для подтверждения регистрации");
    setLoading(false);
  };

  return (
    <Container sx={{ mt: 8, maxWidth: 400, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Регистрация
      </Typography>
      <TextField
        fullWidth
        label="Email"
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        fullWidth
        label="Пароль"
        type="password"
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleRegister}
        disabled={loading}
      >
        Зарегистрироваться
      </Button>

      {/* Добавляем кнопку "Войти" */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          component={Link}
          to="/login"
          fullWidth
        >
          Войти
        </Button>
      </Box>
    </Container>
  );
}
