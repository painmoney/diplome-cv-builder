import React from "react";
import { Container, Typography } from "@mui/material";

export default function ResumePreview() {
  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4">Ваше резюме</Typography>
      <Typography>Здесь будет предварительный просмотр резюме.</Typography>
    </Container>
  );
}
