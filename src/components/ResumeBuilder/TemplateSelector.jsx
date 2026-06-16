
import { Box, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import { TEMPLATE_REGISTRY } from "../../utils/templateRegistry";

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
        {Object.values(TEMPLATE_REGISTRY).map((tpl) => (
          <ToggleButton key={tpl.id} value={tpl.id}>{tpl.label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
