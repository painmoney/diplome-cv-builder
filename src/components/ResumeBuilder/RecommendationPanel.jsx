import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Collapse,
  IconButton,
  Tooltip,
  Divider,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import CodeIcon from "@mui/icons-material/Code";
import GitHubIcon from "@mui/icons-material/GitHub";

const TYPE_META = {
  profile: { label: "Профиль", icon: <PersonIcon fontSize="small" />, tab: 0 },
  skills: { label: "Навыки", icon: <CodeIcon fontSize="small" />, tab: 1 },
  education: { label: "Образование", icon: <SchoolIcon fontSize="small" />, tab: 2 },
  experience: { label: "Опыт", icon: <WorkIcon fontSize="small" />, tab: 3 },
  github: { label: "GitHub", icon: <GitHubIcon fontSize="small" />, tab: 4 },
  content: { label: "Контент", icon: <BoltIcon fontSize="small" />, tab: 0 },
};

const PRIORITY_META = {
  high: { label: "Важно", color: "error" },
  medium: { label: "Желательно", color: "warning" },
  low: { label: "Совет", color: "info" },
};

const getPriority = (text) => {
  const t = String(text || "").toLowerCase();
  if (t.includes("email") || t.includes("телефон")) return "high";
  if (t.includes("опыт") && (t.includes("добавьте") || t.includes("укажите"))) return "high";
  if (t.includes("метрик") || t.includes("цифр")) return "medium";
  if (t.includes("github") || t.includes("репозитор")) return "medium";
  return "low";
};

function calcScore(recommendations = []) {
  const count = Math.min(recommendations.length, 10);
  return Math.max(0, Math.round(100 - count * 10));
}

export default function RecommendationPanel({ recommendations = [], onGoToSection }) {
  const [open, setOpen] = useState(true);
  const score = useMemo(() => calcScore(recommendations), [recommendations]);

  const grouped = useMemo(() => {
    const map = new Map();
    recommendations.forEach((r) => {
      const type = r?.type || "content";
      if (!map.has(type)) map.set(type, []);
      map.get(type).push({ ...r, priority: r.priority || getPriority(r.text) });
    });

    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => {
        const pa = a.priority === "high" ? 0 : a.priority === "medium" ? 1 : 2;
        const pb = b.priority === "high" ? 0 : b.priority === "medium" ? 1 : 2;
        return pa - pb;
      });
      map.set(k, arr);
    }

    const order = ["profile", "content", "skills", "experience", "education", "github"];
    return order.filter((k) => map.has(k)).map((k) => ({ type: k, items: map.get(k) }));
  }, [recommendations]);

  const statusChip = useMemo(() => {
    if (recommendations.length === 0) {
      return { label: "Отлично!", icon: <CheckCircleIcon fontSize="small" />, color: "success" };
    }
    if (score >= 80) return { label: "Почти готово", icon: <BoltIcon fontSize="small" />, color: "success" };
    if (score >= 50) return { label: "Нужно улучшить", icon: <ErrorOutlineIcon fontSize="small" />, color: "warning" };
    return { label: "Требует доработки", icon: <ErrorOutlineIcon fontSize="small" />, color: "error" };
  }, [recommendations.length, score]);

  const go = (tab, target) => {
    if (typeof onGoToSection !== "function") return;
    onGoToSection(tab, target || "");
  };


  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <BoltIcon />
          <Box>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>Рекомендации по резюме</Typography>
            <Typography variant="caption" color="text.secondary">
              Улучшения, которые повышают шанс пройти HR-скрининг
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            icon={statusChip.icon}
            label={`${statusChip.label} • ${score}%`}
            color={statusChip.color}
            variant="filled"
          />
          <Tooltip title={open ? "Свернуть" : "Развернуть"}>
            <IconButton onClick={() => setOpen((v) => !v)} size="small">
              <ExpandMoreIcon
                sx={{
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 180ms ease",
                }}
              />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Box sx={{ px: 2, pb: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 10,
            borderRadius: 999,
            bgcolor: "action.hover",
            "& .MuiLinearProgress-bar": { borderRadius: 999 },
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            {recommendations.length === 0 ? "Все ключевые пункты заполнены" : `Найдено: ${recommendations.length}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Цель: 90%+
          </Typography>
        </Box>
      </Box>

      <Collapse in={open} timeout={220} unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          {recommendations.length === 0 ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 34, mb: 1 }} color="success" />
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Отлично! Резюме выглядит готовым</Typography>
              <Typography variant="body2" color="text.secondary">
                Можно идти в превью и экспортировать PDF/Markdown.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {grouped.map((group, gi) => {
                const meta = TYPE_META[group.type] || TYPE_META.content;
                const firstTarget = group.items?.[0]?.target;

                return (
                  <Box key={group.type}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip size="small" icon={meta.icon} label={meta.label} variant="outlined" />
                        <Typography variant="caption" color="text.secondary">
                          {group.items.length} шт.
                        </Typography>
                      </Box>

                      {meta.tab != null && (
                        <Button size="small" variant="text" onClick={() => go(meta.tab, firstTarget)}>
                          Открыть раздел →
                        </Button>
                      )}
                    </Box>

                    <Stack spacing={1}>
                      {group.items.map((r, idx) => {
                        const p = PRIORITY_META[r.priority] || PRIORITY_META.low;

                        return (
                          <Box
                            key={`${group.type}-${idx}`}
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                              transition: "transform 140ms ease, box-shadow 140ms ease",
                              "&:hover": { transform: "translateY(-1px)", boxShadow: 2 },
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                                {r.text}
                              </Typography>

                              <Chip size="small" label={p.label} color={p.color} variant="outlined" sx={{ flexShrink: 0 }} />
                            </Box>

                            {meta.tab != null && (
                              <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                                <Button size="small" onClick={() => go(meta.tab, r.target)}>
                                  Исправить →
                                </Button>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>

                    {gi !== grouped.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}
