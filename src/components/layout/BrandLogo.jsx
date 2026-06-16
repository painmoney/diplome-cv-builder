import { Box, Typography } from "@mui/material";
import { useThemeMode } from "../../context/ThemeModeContext";

export default function BrandLogo({ compact = false, onClick, sx }) {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 0.8 : 1,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        transition: "transform 180ms ease",
        "&:hover": {
          transform: onClick ? "translateY(-1px)" : "none",
        },
        "&:hover .brand-badge": {
          boxShadow: isDark
            ? "0 0 14px rgba(88,166,255,0.35), 0 2px 8px rgba(88,166,255,0.15)"
            : "0 0 14px rgba(25,118,210,0.30), 0 2px 8px rgba(25,118,210,0.12)",
          "&::after": {
            transform: "translateX(120%)",
          },
        },
        ...sx,
      }}
    >
      <Box
        className="brand-badge"
        sx={{
          width: compact ? 32 : 36,
          height: compact ? 32 : 36,
          borderRadius: compact ? "8px" : "10px",
          display: "grid",
          placeItems: "center",
          background: isDark
            ? "linear-gradient(135deg, #58a6ff 0%, #a78bfa 100%)"
            : "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
          color: "#fff",
          fontWeight: 900,
          fontSize: compact ? "0.7rem" : "0.8rem",
          letterSpacing: 0.5,
          position: "relative",
          overflow: "hidden",
          boxShadow: isDark
            ? "0 0 10px rgba(88,166,255,0.2)"
            : "0 0 10px rgba(25,118,210,0.15)",
          transition: "box-shadow 300ms ease",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.18) 55%, transparent 60%)",
            transform: "translateX(-120%)",
            transition: "transform 500ms ease",
            pointerEvents: "none",
          },
        }}
      >
        CV
      </Box>

      {!compact && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            letterSpacing: 0.5,
            fontSize: "1.05rem",
            lineHeight: 1,
            color: "text.primary",
          }}
        >
          CV Builder
        </Typography>
      )}
    </Box>
  );
}
