import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          CV Builder
        </Typography>
        {user && (
          <Button color="inherit" onClick={handleSignOut}>
            Выйти
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
