import {
  AppBar,
  Toolbar,
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
import BrandLogo from "./BrandLogo";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Редактор", path: "/resume-editor" },
  { label: "Просмотр", path: "/resume-preview" },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = mode === "dark";

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        backgroundColor: isDark
          ? "rgba(15, 23, 42, 0.82)"
          : "rgba(255, 255, 255, 0.88)",
        borderBottom: "1px solid",
        borderColor: isDark
          ? "rgba(255, 255, 255, 0.06)"
          : "rgba(0, 0, 0, 0.07)",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <BrandLogo onClick={() => navigate("/")} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {user &&
            NAV_ITEMS.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: active
                      ? isDark
                        ? "#fff"
                        : "primary.main"
                      : "text.secondary",
                    fontWeight: active ? 600 : 500,
                    borderRadius: "999px",
                    px: 1.8,
                    minWidth: 0,
                    bgcolor: active
                      ? isDark
                        ? "rgba(88,166,255,0.12)"
                        : "rgba(25,118,210,0.08)"
                      : "transparent",
                    border: "1px solid",
                    borderColor: active
                      ? isDark
                        ? "rgba(88,166,255,0.25)"
                        : "rgba(25,118,210,0.18)"
                      : "transparent",
                    transition:
                      "background-color 160ms ease, border-color 160ms ease, transform 160ms ease, color 160ms ease",
                    "&:hover": {
                      bgcolor: active
                        ? isDark
                          ? "rgba(88,166,255,0.18)"
                          : "rgba(25,118,210,0.12)"
                        : isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.04)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}

          <Tooltip title={mode === "dark" ? "Светлая тема" : "Тёмная тема"}>
            <IconButton
              color="inherit"
              onClick={toggleMode}
              sx={{
                color: "text.secondary",
                borderRadius: "999px",
                transition: "background-color 160ms ease, color 160ms ease",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                  color: "text.primary",
                },
              }}
            >
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {user ? (
            <Button
              color="inherit"
              onClick={handleSignOut}
              sx={{
                color: "text.secondary",
                borderRadius: "999px",
                px: 1.8,
                transition: "background-color 160ms ease, color 160ms ease",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                  color: "text.primary",
                },
              }}
            >
              Выйти
            </Button>
          ) : (
            location.pathname !== "/login" && (
              <Button
                color="inherit"
                onClick={() => navigate("/login")}
                sx={{
                  color: "text.secondary",
                  borderRadius: "999px",
                  px: 1.8,
                  transition: "background-color 160ms ease, color 160ms ease",
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                    color: "text.primary",
                  },
                }}
              >
                Войти
              </Button>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
