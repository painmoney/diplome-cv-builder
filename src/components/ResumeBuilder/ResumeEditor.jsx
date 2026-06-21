import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import {
  Container,
  Tabs,
  Tab,
  Box,
  Button,
  Typography,
  Alert,
  TextField,
  Chip,
  Snackbar,
  Stack,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import WorkIcon from "@mui/icons-material/Work";

import {
  loadUserResume,
  normalizeLoadedResumeData,
} from "../../api/resumeService";

import { useAuth } from "../../context/AuthContext";
import { useResumeSaveQueue } from "../../hooks/useResumeSaveQueue";

import ProfileForm from "../profile/ProfileForm";
import EducationBlock from "./EducationBlock";
import SkillsBlock from "./SkillsBlock";
import ExperienceBlock from "./ExperienceBlock";
import GitHubBlock from "./GitHubBlock";
import ProjectsBlock from "./ProjectsBlock";
import TemplateSelector from "./TemplateSelector";
import JobMatchTab from "./JobMatchTab";
import ResumeHealthCheck from "./ResumeHealthCheck";

import RecommendationPanel from "./RecommendationPanel";
import OnboardingChecklist from "./OnboardingChecklist";
import { getRecommendations } from "../../utils/recommendationLogic";
import { validateProfile, formatValidationToast } from "../../utils/validators";

const DEFAULT_RESUME_DATA = {
  profile: { name: "", photo: "", about: "", summary: "", email: "", phone: "" },
  education: [],
  skills: [],
  experience: [],
  github: [],
  projects: [],
  template: "minimalist",
};

export default function ResumeEditor() {
  const { user } = useAuth();
  const location = useLocation();
  const initialTab = location.state?.tab;
  const initialTarget = location.state?.target;

  const [activeTab, setActiveTab] = useState(() => {
    return typeof initialTab === "number" && initialTab >= 0 && initialTab <= 6 ? initialTab : 0;
  });
  const [resumeTitle, setResumeTitle] = useState("Моё IT-резюме");
  const [resumeData, setResumeData] = useState(DEFAULT_RESUME_DATA);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // job match state (persisted across tab switches)
  const [jobMatchText, setJobMatchText] = useState("");
  const [jobMatchResult, setJobMatchResult] = useState(null);
  const [jobMatchError, setJobMatchError] = useState("");
  const [jobMatchAnalyzing, setJobMatchAnalyzing] = useState(false);

  // save status
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error | conflict
  const [saveError, setSaveError] = useState("");

  // toast (validation / errors)
  const [toast, setToast] = useState({ open: false, message: "", severity: "error" });

  // hydration guard — tracks last hydrated snapshot to prevent autosave-on-load
  const isHydratingRef = useRef(true);
  const lastHydratedRef = useRef(null);
  const autosaveTimerRef = useRef(null);

  // mutable ref for queue (avoid stale closures)
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; });

  // Save queue
  const {
    enqueue,
    resetGeneration,
    initFromLoad,
    queue,
  } = useResumeSaveQueue({ userRef, setSaveStatus, setSaveError, setMessage });

  // pending focus
  const pendingFocusRef = useRef(null);
  const focusTriesRef = useRef(0);

  const profileErrors = useMemo(() => validateProfile(resumeData.profile), [resumeData.profile]);
  const isValidForSave = useMemo(() => Object.keys(profileErrors).length === 0, [profileErrors]);

  // navigation from Dashboard completeness chips
  useEffect(() => {
    if (initialTarget) {
      pendingFocusRef.current = { tab: initialTab ?? 0, target: initialTarget };
      focusTriesRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadResumeData = async () => {
    if (!user) return;

    isHydratingRef.current = true;
    setLoading(true);
    setMessage("");

    try {
      const resume = await loadUserResume(user.id);

      if (resume) {
        const normalized = normalizeLoadedResumeData(resume.data || DEFAULT_RESUME_DATA);
        setResumeData(normalized);
        setResumeTitle(resume.title || "Моё IT-резюме");
        initFromLoad(resume);
        // Record hydrated snapshot to prevent autosave-on-load
        lastHydratedRef.current = JSON.stringify(normalized);
      } else {
        setResumeData(DEFAULT_RESUME_DATA);
        setResumeTitle("Моё IT-резюме");
        initFromLoad(null);
        lastHydratedRef.current = JSON.stringify(DEFAULT_RESUME_DATA);
      }

      setSaveStatus("idle");
      setSaveError("");
    } catch (error) {
      setMessage(`Ошибка загрузки: ${error.message}`);
    } finally {
      setLoading(false);
      isHydratingRef.current = false;
    }
  };

  useEffect(() => {
    if (user) {
      resetGeneration();
      loadResumeData(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetch on mount
    }

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- data fetch on user change
  }, [user]);

  const updateSection = (section, newData) => {
    setResumeData((prev) => {
      if (section === "profile") {
        const about = newData.about ?? newData.summary ?? "";
        const summary = newData.summary ?? newData.about ?? "";
        return { ...prev, profile: { ...newData, about, summary } };
      }
      return { ...prev, [section]: newData };
    });
  };

  const handleLoadDevScenario = ({ resumeData: scenarioData, jobText }) => {
    setResumeData(scenarioData);
    setJobMatchText(jobText);
    setJobMatchResult(null);
    // Dev scenario is a user action — clear hydration snapshot
    lastHydratedRef.current = null;
  };

  const flashField = (inputEl) => {
    const target =
      inputEl?.closest?.(".MuiOutlinedInput-root") ||
      inputEl?.closest?.(".MuiInputBase-root") ||
      inputEl;

    if (!target) return;

    const prev = target.style.boxShadow;
    const prevTransition = target.style.transition;

    target.style.transition = "box-shadow 220ms ease";
    target.style.boxShadow = "0 0 0 4px rgba(255, 193, 7, 0.35)";

    setTimeout(() => {
      target.style.boxShadow = prev || "none";
      setTimeout(() => {
        target.style.transition = prevTransition || "";
      }, 240);
    }, 900);
  };

  const focusAndScroll = (targetId) => {
    if (!targetId) return false;
    const el = document.getElementById(targetId);
    if (!el) return false;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof el.focus === "function") el.focus();
    flashField(el);
    return true;
  };

  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    if (activeTab !== pending.tab) return;

    let timer;

    const tryFocus = () => {
      const ok = focusAndScroll(pending.target);
      if (ok) {
        pendingFocusRef.current = null;
        focusTriesRef.current = 0;
        return;
      }

      focusTriesRef.current += 1;
      if (focusTriesRef.current >= 12) {
        pendingFocusRef.current = null;
        focusTriesRef.current = 0;
        return;
      }

      timer = setTimeout(tryFocus, 120);
    };

    timer = setTimeout(tryFocus, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleGoToFromRecommendations = (tabIndex, targetId) => {
    const fallbackByTab = {
      0: "profile-name",
      1: "skills-skill",
      2: "education-institution",
      3: "experience-company",
      4: "github-username",
    };

    const finalTarget = targetId || fallbackByTab[tabIndex];

    if (activeTab === tabIndex) {
      pendingFocusRef.current = null;
      focusTriesRef.current = 0;

      setTimeout(() => {
        focusAndScroll(finalTarget);
      }, 0);

      return;
    }

    setActiveTab(tabIndex);
    pendingFocusRef.current = { tab: tabIndex, target: finalTarget };
    focusTriesRef.current = 0;
  };

  const handleNavigateToTarget = (tabIndex, targetId) => {
    if (activeTab === tabIndex) {
      pendingFocusRef.current = null;
      focusTriesRef.current = 0;
      setTimeout(() => {
        focusAndScroll(targetId);
      }, 0);
      return;
    }

    setActiveTab(tabIndex);
    pendingFocusRef.current = { tab: tabIndex, target: targetId };
    focusTriesRef.current = 0;
  };

  const failValidation = ({ silent }) => {
    setSaveStatus("error");
    setSaveError("Проверьте контакты в профиле");

    if (silent) {
      return;
    }

    const msg = formatValidationToast(profileErrors);

    setActiveTab(0);
    pendingFocusRef.current = { tab: 0, target: "profile-email" };

    if (msg) setToast({ open: true, message: msg, severity: "error" });
  };

  const saveResume = useCallback(({ title, data, silent = false } = {}) => {
    if (!userRef.current) return;

    if (!isValidForSave) {
      failValidation({ silent });
      return;
    }

    enqueue({
      resumeId: queue.resumeId,
      title: title || "Моё IT-резюме",
      template: data?.template || "minimalist",
      data: data || DEFAULT_RESUME_DATA,
      profile: data?.profile || DEFAULT_RESUME_DATA.profile,
      reason: silent ? "autosave" : "manual",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enqueue, isValidForSave]);

  // Autosave with debounce + hydration gate
  useEffect(() => {
    if (!user) return;
    if (isHydratingRef.current) return;

    // Skip if this is the hydrated snapshot (no user edit yet)
    const currentSnapshot = JSON.stringify(resumeData);
    if (lastHydratedRef.current !== null && currentSnapshot === lastHydratedRef.current) {
      return;
    }
    // Clear hydration marker on first real edit
    lastHydratedRef.current = null;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      saveResume({ title: resumeTitle, data: resumeData, silent: true });
    }, 1000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, resumeTitle, user]);

  // Recommendations
  const recommendations = useMemo(() => {
    try {
      return getRecommendations(resumeData);
    } catch {
      return [];
    }
  }, [resumeData]);

  const renderSaveChip = () => {
    if (!isValidForSave) return <Chip size="small" color="warning" label="Проверьте email/телефон" />;
    if (saveStatus === "saving") return <Chip size="small" label="Сохранение..." />;
    if (saveStatus === "saved") return <Chip size="small" color="success" label="Сохранено" />;
    if (saveStatus === "conflict") return <Chip size="small" color="warning" label="Конфликт версий" />;
    if (saveStatus === "error") {
      const label = saveError || "сохранения";
      return <Chip size="small" color="error" label={label} />;
    }
    return <Chip size="small" variant="outlined" label="Не сохранено" />;
  };

  const isSaving = saveStatus === "saving";

  return (
    <Container sx={{ mt: 4, maxWidth: 1200 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h4">Редактор IT-резюме</Typography>
        {renderSaveChip()}
      </Box>

      <TextField
        id="resume-title"
        label="Название резюме"
        value={resumeTitle}
        onChange={(e) => setResumeTitle(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        placeholder="Моё IT-резюме"
      />

      {message && (
        <Alert severity={message.includes("Сохранено") ? "success" : "error"} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {saveStatus === "conflict" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      <RecommendationPanel
        recommendations={recommendations}
        onGoToSection={handleGoToFromRecommendations}
      />

      <TemplateSelector value={resumeData.template} onChange={(t) => updateSection("template", t)} />

      <OnboardingChecklist
        resumeData={resumeData}
        jobMatchResult={jobMatchResult}
        onNavigateToTab={handleNavigateToTarget}
      />

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Профиль" />
        <Tab label="Навыки" />
        <Tab label="Образование" />
        <Tab label="Опыт работы" />
        <Tab label="Портфолио" />
        <Tab label="Анализ вакансии" icon={<WorkIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Проверка" />
      </Tabs>

      <Box sx={{ mb: 3 }}>
        {activeTab === 0 && (
          <ProfileForm
            data={resumeData.profile}
            errors={profileErrors}
            onChange={(d) => updateSection("profile", d)}
            skills={resumeData.skills}
            experience={resumeData.experience}
            github={resumeData.github}
            projects={resumeData.projects}
          />
        )}
        {activeTab === 1 && (
          <SkillsBlock data={resumeData.skills} onChange={(d) => updateSection("skills", d)} />
        )}
        {activeTab === 2 && (
          <EducationBlock data={resumeData.education} onChange={(d) => updateSection("education", d)} />
        )}
        {activeTab === 3 && (
          <ExperienceBlock data={resumeData.experience} onChange={(d) => updateSection("experience", d)} />
        )}
        {activeTab === 4 && (
          <Box>
            <ProjectsBlock data={resumeData.projects} onChange={(value) => updateSection("projects", value)} />
            <Box sx={{ mt: 4 }}>
              <GitHubBlock data={resumeData.github} onChange={(d) => updateSection("github", d)} />
            </Box>
          </Box>
        )}
        {activeTab === 5 && (
          <JobMatchTab
            resumeData={resumeData}
            jdText={jobMatchText}
            setJdText={setJobMatchText}
            result={jobMatchResult}
            setResult={setJobMatchResult}
            error={jobMatchError}
            setError={setJobMatchError}
            isAnalyzing={jobMatchAnalyzing}
            setIsAnalyzing={setJobMatchAnalyzing}
            onNavigateToTarget={handleNavigateToTarget}
            onLoadDevScenario={handleLoadDevScenario}
          />
        )}
        {activeTab === 6 && (
          <ResumeHealthCheck
            resumeData={resumeData}
            jobMatchResult={jobMatchResult}
          />
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => saveResume({ title: resumeTitle, data: resumeData, silent: false })}
          disabled={loading || isSaving}
        >
          {isSaving ? "Сохранение..." : loading ? "Загрузка..." : "Сохранить резюме"}
        </Button>
      </Box>

      <Box
        sx={{
          mb: 4,
          p: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {activeTab === 0 && "Дальше добавьте ключевые навыки — они помогут собрать краткое описание и анализ вакансии."}
          {activeTab === 1 && "Дальше добавьте опыт или проекты, чтобы подтвердить навыки."}
          {activeTab === 2 && "Дальше можно добавить опыт или перейти к проектам."}
          {activeTab === 3 && "Дальше можно добавить ручные проекты и GitHub-репозитории."}
          {activeTab === 4 && "Добавьте проекты и GitHub-репозитории, затем проверьте резюме."}
          {activeTab === 5 && "После анализа можно вернуться к разделам и усилить резюме."}
          {activeTab === 6 && "Исправьте найденные проблемы, затем перейдите к просмотру и экспорту резюме."}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
          <Button
            variant="outlined"
            disabled={activeTab === 0}
            onClick={() => setActiveTab(activeTab - 1)}
            sx={{ minWidth: 120 }}
          >
            ← Назад
          </Button>
          <Button
            variant="outlined"
            disabled={activeTab === 6}
            onClick={() => setActiveTab(activeTab + 1)}
            sx={{ minWidth: 120 }}
          >
            Далее →
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
