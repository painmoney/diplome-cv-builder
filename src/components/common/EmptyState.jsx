import { Box, Typography, Button, Paper } from "@mui/material";

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 2.5 : 3.5,
        borderRadius: 3,
        borderColor: "divider",
        textAlign: "center",
      }}
    >
      {icon && (
        <Box sx={{ mb: 1.5, color: "text.secondary", display: "flex", justifyContent: "center" }}>
          {icon}
        </Box>
      )}

      <Typography
        variant={compact ? "body1" : "h6"}
        sx={{ fontWeight: 700, mb: 0.5 }}
      >
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: actionLabel ? 2 : 0, maxWidth: 400, mx: "auto" }}>
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button variant="contained" size="small" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
}
