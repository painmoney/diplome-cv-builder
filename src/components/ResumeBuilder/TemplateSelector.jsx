
import { Box, Typography, Card, CardActionArea, CardContent, Chip, Stack, Grow } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { TEMPLATE_REGISTRY } from "../../utils/templateRegistry";

export default function TemplateSelector({ value, onChange }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>Шаблон резюме</Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {Object.values(TEMPLATE_REGISTRY).map((tpl, idx) => {
          const isSelected = tpl.id === value;

          return (
            <Grow in key={tpl.id} timeout={300 + idx * 100}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  border: "2px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  bgcolor: isSelected ? "action.hover" : "background.paper",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                  "&:hover": {
                    borderColor: isSelected ? "primary.main" : "primary.light",
                    boxShadow: isSelected ? 4 : 2,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => onChange(tpl.id)}
                  sx={{ height: "100%", p: 0 }}
                >
                  <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {tpl.label}
                      </Typography>
                      {isSelected && (
                        <CheckCircleIcon color="primary" sx={{ fontSize: 20 }} />
                      )}
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, flex: 1 }}
                    >
                      {tpl.description}
                    </Typography>

                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                      {tpl.supportsPdf && <Chip label="PDF" size="small" variant="outlined" />}
                      {tpl.supportsDocx && <Chip label="DOCX" size="small" variant="outlined" />}
                      {tpl.supportsMarkdown && <Chip label="Markdown" size="small" variant="outlined" />}
                    </Stack>

                    {isSelected && (
                      <Chip
                        label="Выбран"
                        color="primary"
                        size="small"
                        sx={{ mt: 1.5, alignSelf: "flex-start" }}
                      />
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grow>
          );
        })}
      </Box>
    </Box>
  );
}
