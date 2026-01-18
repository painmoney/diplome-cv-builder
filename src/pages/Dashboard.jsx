// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { Container, Typography, Button, Snackbar, Alert } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LayoutWrapper from "../components/layout/LayoutWrapper";

export default function Dashboard() {
  const { signOut } = useAuth();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // Выходим
    await signOut(false);

    // Показываем уведомление
    setOpenSnackbar(true);

    // Через 2 секунды редирект на login
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  return (
    <LayoutWrapper>
      <Container
        sx={{
          minHeight: "70vh",             // чтобы центрировать контент относительно футера
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Добро пожаловать в ваш Dashboard!
        </Typography>
        <Button variant="contained" color="error" onClick={handleSignOut} sx={{ mt: 3 }}>
          Выйти
        </Button>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={2000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity="success"
            sx={{ width: "100%" }}
            onClose={handleCloseSnackbar}
          >
            Вы успешно вышли!
          </Alert>
        </Snackbar>
      </Container>
    </LayoutWrapper>
  );
}
