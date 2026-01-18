// src/components/layout/Header.jsx — ПОЛНОСТЬЮ ЗАМЕНИ
import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Логотип - клик на главную */}
        <Typography 
          variant="h6" 
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={() => navigate('/')}
        >
          CV Builder
        </Typography>

        {/* Навигация для залогиненных */}
        {user && (
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/dashboard')}
              variant={location.pathname === '/dashboard' ? 'outlined' : 'text'}
            >
              Dashboard
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate('/resume-editor')}
              variant={location.pathname === '/resume-editor' ? 'outlined' : 'text'}
            >
              Редактор
            </Button>
          </Box>
        )}

        {/* Кнопка выхода */}
        {user && (
          <Button color="inherit" onClick={handleSignOut}>
            Выйти
          </Button>
        )}

        {/* Кнопка входа для неавторизованных */}
        {!user && location.pathname !== '/login' && (
          <Button color="inherit" onClick={() => navigate('/login')}>
            Войти
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
