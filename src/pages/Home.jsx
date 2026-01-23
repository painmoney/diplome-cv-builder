import React, { useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BoltIcon from "@mui/icons-material/Bolt";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import GitHubIcon from "@mui/icons-material/GitHub";
import PaletteIcon from "@mui/icons-material/Palette";
import SecurityIcon from "@mui/icons-material/Security";

import { useAuth } from "../context/AuthContext";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isDark = theme.palette.mode === "dark";

  const primaryCta = user
    ? { label: "Перейти в Dashboard", to: "/dashboard" }
    : { label: "Создать резюме", to: "/register" };

  const chips = useMemo(
    () => [
      { label: "React 18", icon: <BoltIcon /> },
      { label: "Material UI", icon: <PaletteIcon /> },
      { label: "Supabase", icon: <SecurityIcon /> },
      { label: "PDF / Markdown / PNG", icon: <FileDownloadIcon /> },
      { label: "20+ рекомендаций", icon: <AutoAwesomeIcon /> },
    ],
    []
  );

  const features = useMemo(
    () => [
      {
        title: "Интеллектуальные рекомендации",
        text: "Проверка резюме по 20+ критериям и подсказки, что улучшить для HR-скрининга.",
        icon: <AutoAwesomeIcon />,
      },
      {
        title: "Редактор + автосохранение",
        text: "5 вкладок, валидация в реальном времени и автосейв с debounce, чтобы ничего не потерять.",
        icon: <FactCheckIcon />,
      },
      {
        title: "Шаблоны под разные цели",
        text: "Минималистичный, академический и GitHub-стиль — переключаются мгновенно.",
        icon: <PaletteIcon />,
      },
      {
        title: "GitHub интеграция",
        text: "Подтягивай последние репозитории по username и показывай активность в open-source.",
        icon: <GitHubIcon />,
      },
      {
        title: "Экспорт в один клик",
        text: "PDF для отправки работодателю, Markdown для GitHub/Notion, PNG/JPG для быстрого шаринга.",
        icon: <FileDownloadIcon />,
      },
      {
        title: "Безопасность данных",
        text: "Доступ к данным ограничен Row Level Security — пользователь видит только свои записи.",
        icon: <SecurityIcon />,
      },
    ],
    []
  );

  // ✅ добавили template ключ (именно он будет улетать в query param)
  const templates = useMemo(
    () => [
      {
        title: "Minimalist",
        caption: "Чистый современный стиль для продуктовых команд и стартапов.",
        tag: "product",
        template: "minimalist",
      },
      {
        title: "Academic",
        caption: "Строгая типографика и двухколоночная сетка для исследований и вузов.",
        tag: "research",
        template: "academic",
      },
      {
        title: "GitHub",
        caption: "Тёмная “терминальная” эстетика для разработчиков и open-source.",
        tag: "dev",
        template: "github",
      },
    ],
    []
  );

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Box>
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: { xs: 3, md: 4 },
          mt: { xs: 2, md: 3 },
          p: { xs: 3, sm: 4, md: 6 },
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: 0,
          "&:before": {
            content: '""',
            position: "absolute",
            inset: -2,
            background: isDark
              ? `radial-gradient(900px 500px at 15% 0%, rgba(88,166,255,0.18), transparent 55%),
                 radial-gradient(900px 500px at 85% 5%, rgba(167,139,250,0.14), transparent 55%),
                 radial-gradient(900px 500px at 50% 110%, rgba(34,211,238,0.10), transparent 55%)`
              : `radial-gradient(900px 500px at 10% -10%, rgba(25,118,210,0.18), transparent 55%),
                 radial-gradient(900px 500px at 90% 10%, rgba(220,0,78,0.10), transparent 55%),
                 radial-gradient(900px 500px at 50% 120%, rgba(46,125,50,0.10), transparent 55%)`,
            zIndex: 0,
          },
        }}
      >
        <Grid
          container
          spacing={{ xs: 4, md: 5 }}
          alignItems="center"
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Grid item xs={12} md={7}>
            <Box component={motion.div} {...fadeUp}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  letterSpacing: 0.2,
                  fontSize: { xs: "2.0rem", sm: "2.6rem", md: "3.1rem" },
                  lineHeight: 1.05,
                }}
              >
                Собери сильное IT-резюме в
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${
                      isDark ? "#a78bfa" : "#dc004e"
                    })`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  CV Builder
                </Box>
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 1.5, maxWidth: 720 }}
              >
                Редактор резюме для разработчиков, QA, DevOps и дизайнеров: шаблоны,
                GitHub, экспорт в PDF/Markdown и умные рекомендации, чтобы пройти HR-скрининг.
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 2.5, flexWrap: "wrap", gap: 1 }}
              >
                {chips.map((c) => (
                  <Chip
                    key={c.label}
                    icon={c.icon}
                    label={c.label}
                    variant="outlined"
                  />
                ))}
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mt: 3 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to={primaryCta.to}
                  sx={{ px: 3, py: 1.15 }}
                >
                  {primaryCta.label}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => scrollToId("cv_templates")}
                  sx={{ px: 3, py: 1.15 }}
                >
                  Посмотреть шаблоны
                </Button>
                <Button
                  variant="text"
                  size="large"
                  onClick={() => navigate(user ? "/resume-editor" : "/login")}
                  sx={{ px: 2.0, py: 1.15 }}
                >
                  Открыть редактор
                </Button>
              </Stack>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5 }}
              >
                Данные защищены Supabase RLS • Автосохранение и валидация • Экспорт
                в один клик
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 18 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.65, delay: 0.1 },
              }}
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                overflow: "hidden",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Качество резюме
                  </Typography>
                  <Chip
                    icon={<BoltIcon />}
                    label="Почти готово"
                    color="success"
                    variant="outlined"
                  />
                </Stack>

                <Box sx={{ mt: 1.5 }}>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 900, lineHeight: 1 }}
                  >
                    80/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={80}
                    sx={{ mt: 1.2, height: 10, borderRadius: 999 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.1}>
                  {[
                    "Добавь 2–3 сильных навыка уровня 4–5",
                    "Опиши опыт действиями и метриками (%, время, пользователи)",
                    "Подключи GitHub и добавь описания репозиториев",
                  ].map((t) => (
                    <Box
                      key={t}
                      sx={{
                        display: "flex",
                        gap: 1.2,
                        alignItems: "flex-start",
                      }}
                    >
                      <Box
                        sx={{
                          mt: 0.35,
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          bgcolor: theme.palette.primary.main,
                          flex: "0 0 auto",
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {t}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  <Chip size="small" label="PDF" />
                  <Chip size="small" label="Markdown" />
                  <Chip size="small" label="PNG/JPG" />
                  <Chip size="small" icon={<GitHubIcon />} label="GitHub" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* FEATURES */}
      <Box sx={{ mt: { xs: 6, md: 8 } }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Что умеет CV Builder
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 1, maxWidth: 860 }}
        >
          Приложение помогает собрать резюме, которое выглядит профессионально и
          содержит то, что важно для IT-вакансий.
        </Typography>

        <Grid container spacing={2.2} sx={{ mt: 2.5 }}>
          {features.map((f) => (
            <Grid key={f.title} item xs={12} sm={6} md={4}>
              <Card
                component={motion.div}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: isDark
                        ? "rgba(88,166,255,0.12)"
                        : "rgba(25,118,210,0.10)",
                      color: "primary.main",
                      mb: 1.5,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                    {f.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* TEMPLATES */}
      <Box id="cv_templates" sx={{ mt: { xs: 6, md: 8 } }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Шаблоны
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Выбирай стиль под компанию и роль — можно переключать даже в превью.
        </Typography>

        <Grid container spacing={2.2} sx={{ mt: 2.5 }}>
          {templates.map((t) => (
            <Grid key={t.title} item xs={12} md={4}>
              <Card
                component={motion.div}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: 140,
                    p: 2.2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    background: isDark
                      ? "linear-gradient(135deg, rgba(88,166,255,0.18), rgba(167,139,250,0.12))"
                      : "linear-gradient(135deg, rgba(25,118,210,0.14), rgba(220,0,78,0.08))",
                  }}
                >
                  <Typography variant="overline" color="text.secondary">
                    template
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {t.title}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}
                  >
                    <Chip size="small" label={t.tag} variant="outlined" />
                    <Chip size="small" label="instant switch" variant="outlined" />
                  </Stack>
                </Box>

                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t.caption}
                  </Typography>

                  {/* ✅ передаём выбранный шаблон */}
                  <Button
                    variant="text"
                    sx={{ mt: 1.5, px: 0 }}
                    onClick={() =>
                      navigate(
                        user ? `/resume-preview?template=${t.template}` : "/register"
                      )
                    }
                  >
                    Открыть превью →
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* HOW IT WORKS */}
      <Box sx={{ mt: { xs: 6, md: 8 } }}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Как это работает
        </Typography>

        <Grid container spacing={2.2} sx={{ mt: 2.5 }}>
          {[
            {
              n: "01",
              title: "Заполни профиль",
              text: "Контакты и краткое “о себе” — база для первого впечатления.",
            },
            {
              n: "02",
              title: "Добавь навыки и опыт",
              text: "Фокус на действиях и цифрах: влияние, скорость, масштабы.",
            },
            {
              n: "03",
              title: "Исправь рекомендации",
              text: "Панель подсказок ведёт прямо к проблемному полю (вкладка → фокус → подсветка).",
            },
            {
              n: "04",
              title: "Экспортируй",
              text: "PDF для отклика, Markdown для GitHub/Notion, изображения для шаринга.",
            },
          ].map((s) => (
            <Grid key={s.n} item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 900,
                      letterSpacing: 1.2,
                      color: "text.secondary",
                    }}
                  >
                    {s.n}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {s.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                    {s.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA */}
      <Box
        sx={{
          mt: { xs: 6, md: 8 },
          mb: { xs: 6, md: 8 },
          p: { xs: 3, md: 4 },
          borderRadius: { xs: 3, md: 4 },
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Готов(а) улучшить резюме?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Начни с шаблона, заполни данные и доведи качество до “Отлично!” —
              дальше останется только экспорт.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={1.2}>
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to={primaryCta.to}
              >
                {primaryCta.label}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => scrollToId("cv_templates")}
              >
                Шаблоны
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
