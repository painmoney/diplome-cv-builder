import { Backdrop, CircularProgress, Typography, Paper } from "@mui/material";

const FORMAT_TEXT = {
  PDF: "Готовим PDF...",
  DOCX: "Формируем DOCX...",
  PNG: "Создаём PNG...",
  JPG: "Создаём JPG...",
  Markdown: "Формируем Markdown...",
};

export default function ExportProgressBackdrop({ open, format = "PDF", message }) {
  const text = message || FORMAT_TEXT[format] || `Готовим ${format}...`;

  return (
    <Backdrop
      open={open}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: "#fff" }}
    >
      <Paper
        elevation={6}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          p: 4,
          borderRadius: 3,
          minWidth: 220,
        }}
      >
        <CircularProgress color="inherit" size={48} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {text}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Это может занять несколько секунд
        </Typography>
      </Paper>
    </Backdrop>
  );
}
