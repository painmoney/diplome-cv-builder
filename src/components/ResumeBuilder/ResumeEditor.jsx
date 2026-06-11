import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "@mui/material";

import {
  loadUserResume,
  saveResumeFull,
  normalizeLoadedResumeData,
} from "../../api/resumeService";

import { useAuth } from "../../context/AuthContext";

import ProfileForm from "../profile/ProfileForm";
import EducationBlock from "./EducationBlock";
import SkillsBlock from "./SkillsBlock";
import ExperienceBlock from "./ExperienceBlock";
import GitHubBlock from "./GitHubBlock";
import TemplateSelector from "./TemplateSelector";

import RecommendationPanel from "./RecommendationPanel";
import { getRecommendations } from "../../utils/recommendationLogic";
import { validateProfile, formatValidationToast } from "../../utils/validators";

const DEFAULT_RESUME_DATA = {
  profile: { name: "", photo: "", about: "", summary: "", email: "", phone: "" },
  education: [],
  skills: [],
  experience: [],
  github: [],
  template: "minimalist",
};

export default function ResumeEditor() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [resumeTitle, setResumeTitle] = useState("Моё IT-резюме");
  const [resumeData, setResumeData] = useState(DEFAULT_RESUME_DATA);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // статус сохранения
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState("");

  // тосты (валидация / ошибки)
  const [toast, setToast] = useState({ open: false, message: "", severity: "error" });
  const lastAutoToastRef = useRef(0);

  // чтобы не автосейвить во время гидрации
  const isHydratingRef = useRef(true);
  const autosaveTimerRef = useRef(null);

  // pending focus
  const pendingFocusRef = useRef(null); // { tab, target }
  const focusTriesRef = useRef(0);

  const profileErrors = useMemo(() => validateProfile(resumeData.profile), [resumeData.profile]);
  const isValidForSave = useMemo(() => Object.keys(profileErrors).length === 0, [profileErrors]);

  useEffect(() => {
    if (user) {
      loadResumeData();
    }

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadResumeData = async () => {
    if (!user) return;

    isHydratingRef.current = true;
    setLoading(true);
    setMessage("");

    try {
      const resume = await loadUserResume(user.id);

      if (resume) {
        setResumeData(normalizeLoadedResumeData(resume.data || DEFAULT_RESUME_DATA));
        setResumeTitle(resume.title || "Моё IT-резюме");
      } else {
        setResumeData(DEFAULT_RESUME_DATA);
        setResumeTitle("Моё IT-резюме");
      }

      setSaveStatus("idle");
      setSaveError("");
    } catch (error) {
      console.error("❌ Load error:", error);
      setMessage(`Ошибка загрузки: ${error.message}`);
    } finally {
      setLoading(false);
      isHydratingRef.current = false;
    }
  };

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

  const flashField = (inputEl) => {
    // пытаемся подсветить красивее — на .MuiOutlinedInput-root
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

  // когда вкладка уже переключилась — делаем попытки фокуса
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

    // если уже на нужной вкладке — фокусим сразу (иначе useEffect не сработает)
    if (activeTab === tabIndex) {
      pendingFocusRef.current = null;
      focusTriesRef.current = 0;

      // небольшая задержка на всякий случай, чтобы DOM точно был готов
      setTimeout(() => {
        focusAndScroll(finalTarget);
      }, 0);

      return;
    }

  setActiveTab(tabIndex);
  pendingFocusRef.current = { tab: tabIndex, target: finalTarget };
  focusTriesRef.current = 0;

    pendingFocusRef.current = { tab: tabIndex, target: targetId || fallbackByTab[tabIndex] };
    focusTriesRef.current = 0;
  };

  const failValidation = ({ silent }) => {
    setSaveStatus("error");
    setSaveError("validation");

    const msg = formatValidationToast(profileErrors);

    // Валидация всегда открывает вкладку профиля, чтобы человек видел поля
    setActiveTab(0);
    pendingFocusRef.current = { tab: 0, target: "profile-email" };

    // не спамим автосейвом
    if (silent) {
      const now = Date.now();
      if (now - lastAutoToastRef.current > 7000 && msg) {
        lastAutoToastRef.current = now;
        setToast({ open: true, message: msg, severity: "error" });
      }
      return;
    }

    if (msg) setToast({ open: true, message: msg, severity: "error" });
  };

  const saveResume = async ({ silent = false } = {}) => {
    if (!user) return;

    if (!isValidForSave) {
      failValidation({ silent });
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
        setMessage("");
      }

      setSaveStatus("saving");
      setSaveError("");

      await saveResumeFull(user.id, resumeTitle, resumeData);

      setSaveStatus("saved");
      if (!silent) setMessage("Резюме сохранено!");
    } catch (e) {
      console.error("❌ Save exception:", e);
      setSaveStatus("error");
      setSaveError(e?.message || "Неизвестная ошибка");

      if (!silent) {
        setMessage(`Ошибка: ${e?.message || "Неизвестная ошибка"}`);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Автосохранение с debounce
  useEffect(() => {
    if (!user) return;
    if (isHydratingRef.current) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      saveResume({ silent: true });
    }, 1000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [resumeData, resumeTitle, user]);

  // Рекомендации
  const recommendations = useMemo(() => {
    try {
      return getRecommendations(resumeData);
    } catch (e) {
      console.error("Recommendations error:", e);
      return [];
    }
  }, [resumeData]);

  const renderSaveChip = () => {
    if (!isValidForSave) return <Chip size="small" color="warning" label="Проверьте email/телефон" />;
    if (saveStatus === "saving") return <Chip size="small" label="Сохранение..." />;
    if (saveStatus === "saved") return <Chip size="small" color="success" label="Сохранено" />;
    if (saveStatus === "error") {
      const label = saveError === "validation" ? "Ошибка: неверные поля" : `Ошибка: ${saveError || "сохранения"}`;
      return <Chip size="small" color="error" label={label} />;
    }
    return <Chip size="small" variant="outlined" label="Не сохранено" />;
  };

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
        <Alert severity={message.includes("✅") ? "success" : "error"} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <RecommendationPanel
        recommendations={recommendations}
        onGoToSection={handleGoToFromRecommendations}
      />

      <TemplateSelector value={resumeData.template} onChange={(t) => updateSection("template", t)} />

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Профиль" />
        <Tab label="Навыки" />
        <Tab label="Образование" />
        <Tab label="Опыт работы" />
        <Tab label="GitHub" />
      </Tabs>

      <Box sx={{ mb: 3 }}>
        {activeTab === 0 && (
          <ProfileForm
            data={resumeData.profile}
            errors={profileErrors}
            onChange={(d) => updateSection("profile", d)}
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
          <GitHubBlock data={resumeData.github} onChange={(d) => updateSection("github", d)} />
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Button variant="contained" size="large" onClick={() => saveResume({ silent: false })} disabled={loading}>
          {loading ? "Сохранение..." : "Сохранить резюме"}
        </Button>
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
