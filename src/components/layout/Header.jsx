import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useThemeMode } from "../../context/ThemeModeContext";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

export default function Header() {
  const { user, signOut } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(25, 118, 210, 0.85)",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Лого */}
        <Typography
          variant="h6"
          onClick={() => navigate("/")}
          sx={{
            cursor: "pointer",
            fontWeight: 700,
            letterSpacing: 1,
            transition: "opacity 0.2s",
            "&:hover": { opacity: 0.8 },
          }}
        >
          CV Builder
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Навигация */}
          {user && (
            <>
              <Button
                color="inherit"
                onClick={() => navigate("/dashboard")}
                sx={{
                  borderBottom:
                    location.pathname === "/dashboard"
                      ? "2px solid white"
                      : "none",
                }}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate("/resume-editor")}
                sx={{
                  borderBottom:
                    location.pathname === "/resume-editor"
                      ? "2px solid white"
                      : "none",
                }}
              >
                Редактор
              </Button>
            </>
          )}

          {/* Переключатель темы */}
          <Tooltip title={mode === "dark" ? "Светлая тема" : "Тёмная тема"}>
            <IconButton color="inherit" onClick={toggleMode}>
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Auth кнопки */}
          {user ? (
            <Button color="inherit" onClick={handleSignOut}>
              Выйти
            </Button>
          ) : (
            location.pathname !== "/login" && (
              <Button color="inherit" onClick={() => navigate("/login")}>
                Войти
              </Button>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
