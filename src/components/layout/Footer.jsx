import { Box, Typography, Stack } from "@mui/material";
import { useThemeMode } from "../../context/ThemeModeContext";
import BrandLogo from "./BrandLogo";

const MARQUEE_ITEMS = [
  "IT-резюме",
  "GitHub-проекты",
  "Проверка резюме",
  "Анализ вакансии",
  "Evidence Score",
  "PDF",
  "DOCX",
  "Markdown",
  "ATS-риски",
  "AI-рекомендации",
];

const FEATURES_ROW = [
  "PDF · DOCX · Markdown",
  "GitHub · Job Match · Health Check",
];

export default function Footer() {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        overflow: "hidden",
      }}
    >
      {/* Marquee */}
      <Box
        className="footer-marquee-track"
        sx={{
          width: "100%",
          overflow: "hidden",
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 0.75,
          position: "relative",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 60,
            zIndex: 2,
            pointerEvents: "none",
          },
          "&::before": {
            left: 0,
            background: isDark
              ? "linear-gradient(to right, #0f172a, transparent)"
              : "linear-gradient(to right, #ffffff, transparent)",
          },
          "&::after": {
            right: 0,
            background: isDark
              ? "linear-gradient(to left, #0f172a, transparent)"
              : "linear-gradient(to left, #ffffff, transparent)",
          },
        }}
      >
        <Box className="footer-marquee-inner">
          {[0, 1, 2].map((set) => (
            <Box className="footer-marquee-group" key={set}>
              {MARQUEE_ITEMS.map((item, i) => (
                <Box
                  key={`${set}-${i}`}
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    mx: 1.5,
                    color: "text.secondary",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    letterSpacing: 0.3,
                    "&::after": {
                      content: '"·"',
                      ml: 1.5,
                      color: "text.disabled",
                    },
                  }}
                >
                  {item}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Main footer content */}
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2.5, md: 4 },
          py: { xs: 3, md: 3.5 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <BrandLogo />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 320, lineHeight: 1.55 }}
          >
            Инструмент для создания, проверки и экспорта IT-резюме.
          </Typography>
        </Box>

        <Stack
          direction="column"
          alignItems={{ xs: "flex-start", sm: "flex-end" }}
          spacing={0.75}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", fontSize: "0.65rem" }}
          >
            Возможности
          </Typography>
          {FEATURES_ROW.map((row) => (
            <Typography
              key={row}
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 500, letterSpacing: 0.2 }}
            >
              {row}
            </Typography>
          ))}
        </Stack>
      </Box>

      {/* Copyright */}
      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          py: 1.5,
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © 2026 CV Builder
        </Typography>
      </Box>
    </Box>
  );
}
