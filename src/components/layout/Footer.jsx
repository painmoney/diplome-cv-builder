import React from "react";
import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        py: 2,
        textAlign: "center",
        bgcolor: "background.paper",
        color: "text.secondary",
        borderTop: "1px solid",
        borderColor: "divider",
        backdropFilter: "blur(8px)",
      }}
    >
      <Typography variant="body2">
        © 2026 CV Builder. Все права защищены.
      </Typography>
    </Box>
  );
}
