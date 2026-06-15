import { useMemo } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
} from "@mui/material";
import {
  ExpandMore,
  CheckCircle,
  Error,
  Warning,
  Info,
} from "@mui/icons-material";
import { analyzeResumeHealth, TEMPLATE_META } from "../../utils/resumeHealthUtils";

const LEVEL_CONFIG = {
  excellent: { label: "Отлично", color: "success" },
  good: { label: "Хорошо", color: "success" },
  needs_improvement: { label: "Нужно улучшить", color: "warning" },
  weak: { label: "Слабое", color: "error" },
};

const CATEGORY_LABELS = {
  completeness: "Заполненность",
  contentQuality: "Качество содержания",
  atsReadiness: "Совместимость с ATS",
  github: "GitHub",
  jobMatch: "Под вакансию",
};

const SEVERITY_ICON = {
  success: <CheckCircle fontSize="small" color="success" />,
  info: <Info fontSize="small" color="info" />,
  warning: <Warning fontSize="small" color="warning" />,
  error: <Error fontSize="small" color="error" />,
};

const SEVERITY_COLOR = {
  success: "success",
  info: "info",
  warning: "warning",
  error: "error",
};

function ScoreBar({ score, label, severity }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
      <Typography variant="body2" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={score}
          color={severity}
          sx={{ height: 8, borderRadius: 1 }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, textAlign: "right" }}>
        {score}%
      </Typography>
    </Box>
  );
}

function CheckItem({ check }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, py: 0.5 }}>
      {SEVERITY_ICON[check.severity]}
      <Box>
        <Typography variant="body2" fontWeight="medium">
          {check.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {check.description}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ResumeHealthCheck({ resumeData, jobMatchResult }) {
  const health = useMemo(
    () => analyzeResumeHealth(resumeData, jobMatchResult),
    [resumeData, jobMatchResult]
  );

  const levelConfig = LEVEL_CONFIG[health.level] || LEVEL_CONFIG.weak;
  const template = resumeData?.template || "minimalist";
  const templateMeta = TEMPLATE_META[template];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Проверка резюме
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              {health.score}%
            </Typography>
            <Chip label={levelConfig.label} color={levelConfig.color} size="small" />
          </Box>
          <LinearProgress
            variant="determinate"
            value={health.score}
            color={levelConfig.color}
            sx={{ height: 10, borderRadius: 1 }}
          />
        </CardContent>
      </Card>

      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        Категории
      </Typography>
      <Box sx={{ mb: 3 }}>
        {Object.entries(health.categories).map(([key, cat]) => (
          cat.notChecked ? (
            <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography variant="body2" sx={{ minWidth: 180 }}>
                {CATEGORY_LABELS[key] || key}
              </Typography>
              <Chip label="Не проверено" size="small" variant="outlined" />
            </Box>
          ) : (
            <ScoreBar
              key={key}
              score={cat.score}
              label={CATEGORY_LABELS[key] || key}
              severity={cat.score >= 70 ? "success" : cat.score >= 50 ? "warning" : "error"}
            />
          )
        ))}
      </Box>

      {health.topIssues.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Важные замечания ({health.topIssues.length})
          </Typography>
          {health.topIssues.map((check) => (
            <Alert key={check.id} severity={SEVERITY_COLOR[check.severity]} sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {check.title}
              </Typography>
              <Typography variant="caption">{check.description}</Typography>
            </Alert>
          ))}
        </Box>
      )}

      {templateMeta && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Рекомендации по шаблону
          </Typography>
          <Alert severity="info">
            <Typography variant="body2" fontWeight="medium">
              {templateMeta.label}: {templateMeta.description}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Подходит для: {templateMeta.recommendedFor.join(", ")}.
            </Typography>
          </Alert>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Рекомендации по экспорту
        </Typography>
        <Alert severity="info">
          <Typography variant="body2">
            PDF создаётся через react-pdf — это текстовый документ (не изображение). Подходит для отправки рекрутеру напрямую.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            DOCX обычно безопаснее для ATS-порталов. Если работодатель указал формат — следуйте его требованиям.
          </Typography>
        </Alert>
      </Box>

      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        Все проверки ({health.checks.length})
      </Typography>
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="body2" color="text.secondary">
            Показать все проверки
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {health.checks.map((check) => (
            <CheckItem key={check.id} check={check} />
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
