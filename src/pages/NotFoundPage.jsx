import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h1" sx={{ fontWeight: 800, color: "text.secondary" }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Страница не найдена
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Запрашиваемая страница не существует или была перемещена.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        На главную
      </Button>
    </Box>
  );
}
