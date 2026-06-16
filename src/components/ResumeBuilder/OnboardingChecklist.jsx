import { useMemo, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack,
  Button,
  Typography,
  Box,
  Collapse,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { normalizeResumeData, safeText } from "../../utils/helpers";

const STORAGE_KEY = "cv_onboarding_collapsed";

function loadCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveCollapsed(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // noop
  }
}

function buildSteps(data, jobMatchResult) {
  const { profile, skills, experience, github } = data;

  const profileDone =
    safeText(profile.name) && safeText(profile.email);
  const skillsDone = (skills?.length || 0) >= 5;
  const experienceDone = (experience?.length || 0) > 0;
  const githubDone = (github?.length || 0) > 0;
  const jobMatchDone = !!jobMatchResult;

  return [
    {
      id: "profile",
      title: profileDone ? "Профиль заполнен" : "Заполните профиль",
      description:
        "ФИО, email и контакты нужны для связи с кандидатом.",
      completed: profileDone,
      optional: false,
      tabIndex: 0,
      targetId: "profile-name",
    },
    {
      id: "skills",
      title: skillsDone ? "Навыки добавлены" : "Добавьте навыки",
      description:
        "Укажите ключевые технологии и инструменты, которые соответствуют вашему опыту.",
      completed: skillsDone,
      optional: false,
      tabIndex: 1,
      targetId: "skills-skill",
    },
    {
      id: "experience",
      title: experienceDone ? "Опыт добавлен" : "Добавьте опыт",
      description:
        "Опишите задачи, стек и результат работы. Это сильнее простого списка навыков.",
      completed: experienceDone,
      optional: false,
      tabIndex: 3,
      targetId: "experience-company",
    },
    {
      id: "github",
      title: githubDone ? "GitHub-проекты выбраны" : "Выберите GitHub-проекты",
      description:
        "Добавьте до 5 релевантных репозиториев, чтобы подтвердить практический опыт.",
      completed: githubDone,
      optional: false,
      tabIndex: 4,
      targetId: "github-username",
    },
    {
      id: "health",
      title: "Проверьте резюме",
      description:
        "Health Check покажет слабые места, ATS-риски и рекомендации по экспорту.",
      completed: false,
      optional: false,
      tabIndex: 6,
      targetId: null,
      actionLabel: "Открыть проверку",
    },
    {
      id: "jobmatch",
      title: jobMatchDone ? "Вакансия проанализирована" : "Сравните с вакансией",
      description:
        "Job Match покажет совпадения, missing skills и Evidence Score.",
      completed: jobMatchDone,
      optional: true,
      tabIndex: 5,
      targetId: null,
    },
  ];
}

function StepRow({ step, isNext, onGo }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        py: 0.75,
        px: 1.25,
        borderRadius: 1.5,
        bgcolor: isNext ? "action.hover" : "transparent",
        border: "1px solid",
        borderColor: isNext ? "primary.main" : "divider",
        transition: "background-color 150ms ease, border-color 150ms ease",
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        {step.completed ? (
          <CheckCircleOutlineIcon fontSize="small" color="success" />
        ) : (
          <RadioButtonUncheckedIcon
            fontSize="small"
            color={isNext ? "primary" : "disabled"}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: step.completed ? 400 : 600,
              color: step.completed ? "text.secondary" : "text.primary",
            }}
          >
            {step.title}
          </Typography>

          {step.completed ? (
            <Chip size="small" label="Готово" color="success" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
          ) : isNext ? (
            <Chip size="small" label="Следующий шаг" color="primary" variant="filled" sx={{ height: 20, fontSize: "0.7rem" }} />
          ) : step.optional ? (
            <Chip size="small" label="Дополнительно" color="info" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
          ) : null}
        </Stack>

        {!step.completed && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            {step.description}
          </Typography>
        )}
      </Box>

      {!step.completed && (
        <Button
          size="small"
          variant={isNext ? "contained" : "outlined"}
          endIcon={<ArrowForwardIcon />}
          onClick={() => onGo(step.tabIndex, step.targetId)}
          sx={{ flexShrink: 0, textTransform: "none" }}
        >
          {step.actionLabel || "Перейти"}
        </Button>
      )}
    </Box>
  );
}

export default function OnboardingChecklist({
  resumeData,
  jobMatchResult = null,
  onNavigateToTab,
}) {
  const [collapsed, setCollapsed] = useState(loadCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      saveCollapsed(next);
      return next;
    });
  }, []);

  const steps = useMemo(() => {
    const data = normalizeResumeData(resumeData);
    return buildSteps(data, jobMatchResult);
  }, [resumeData, jobMatchResult]);

  const requiredSteps = useMemo(() => steps.filter((s) => !s.optional), [steps]);
  const completedCount = useMemo(
    () => requiredSteps.filter((s) => s.completed).length,
    [requiredSteps]
  );
  const totalCount = requiredSteps.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const nextStep = useMemo(
    () => steps.find((s) => !s.completed && !s.optional) || null,
    [steps]
  );

  const handleGo = useCallback(
    (tabIndex, targetId) => {
      if (typeof onNavigateToTab === "function") {
        onNavigateToTab(tabIndex, targetId);
      }
    },
    [onNavigateToTab]
  );

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ cursor: "pointer" }}
          onClick={toggleCollapsed}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <LightbulbIcon fontSize="small" color="primary" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                План создания IT-резюме
              </Typography>
              {!collapsed && (
                <Typography variant="caption" color="text.secondary">
                  Заполните ключевые разделы, проверьте резюме и подготовьте файл для отклика.
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={`${completedCount} из ${totalCount}`}
              color={progress === 100 ? "success" : "default"}
              variant={progress === 100 ? "filled" : "outlined"}
            />
            {collapsed ? (
              <ExpandMoreIcon fontSize="small" color="action" />
            ) : (
              <ExpandLessIcon fontSize="small" color="action" />
            )}
          </Stack>
        </Stack>

        <Collapse in={!collapsed} timeout="auto">
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 999,
                mb: 2,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": { borderRadius: 999 },
              }}
            />

            <Stack spacing={1}>
              {steps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  isNext={nextStep?.id === step.id}
                  onGo={handleGo}
                />
              ))}
            </Stack>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
