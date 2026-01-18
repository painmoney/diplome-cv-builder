import React, { useState } from "react";
import { Container, TextField, Button, Typography, Box, Snackbar, Alert } from "@mui/material";
import { supabase } from "../api/supabaseClient";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleRegister = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    setLoading(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setSnackbar({ 
          open: true, 
          message: 'Этот email уже зарегистрирован. Войдите через Login.', 
          severity: 'error' 
        });
      } else {
        setSnackbar({ open: true, message: error.message, severity: 'error' });
      }
    } else {
      setSnackbar({ 
        open: true, 
        message: '✅ Проверьте почту для подтверждения регистрации!', 
        severity: 'success' 
      });
      setTimeout(() => navigate('/login'), 3000);
    }
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
