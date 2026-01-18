import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';

export default function TemplateSelector({ value, onChange }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>Шаблон резюме</Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newValue) => newValue && onChange(newValue)}
        aria-label="template"
      >
        <ToggleButton value="minimalist">Минималистичный</ToggleButton>
        <ToggleButton value="academic">Академический</ToggleButton>
        <ToggleButton value="github">GitHub-стиль</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
