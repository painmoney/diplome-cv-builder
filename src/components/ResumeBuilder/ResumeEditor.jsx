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
} from "@mui/material";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../context/AuthContext";

import ProfileForm from "../profile/ProfileForm";
import EducationBlock from "./EducationBlock";
import SkillsBlock from "./SkillsBlock";
import ExperienceBlock from "./ExperienceBlock";
import GitHubBlock from "./GitHubBlock";
import TemplateSelector from "./TemplateSelector";

import RecommendationPanel from "./RecommendationPanel";
import { getRecommendations } from "../../utils/recommendationLogic";

const DEFAULT_RESUME_DATA = {
  profile: { name: "", photo: "", about: "", summary: "" }, // поддержим оба поля
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

  // состояние автосохранения
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState("");

  // чтобы не запускать автосейв во время первичной загрузки
  const isHydratingRef = useRef(true);
  const autosaveTimerRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadResumeData();
    }
    // cleanup таймера при размонтировании
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

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setLoading(false);

    if (error) {
      console.error("❌ Load error:", error);
      setMessage(`Ошибка загрузки: ${error.message}`);
      isHydratingRef.current = false;
      return;
    }

    if (data) {
      const loadedData = data.data || DEFAULT_RESUME_DATA;

      // небольшой “мост” между about/summary
      const profile = loadedData.profile || {};
      const bridgedProfile = {
        ...profile,
        about: profile.about ?? profile.summary ?? "",
        summary: profile.summary ?? profile.about ?? "",
      };

      setResumeData({
        ...DEFAULT_RESUME_DATA,
        ...loadedData,
        profile: bridgedProfile,
      });

      setResumeTitle(data.title || "Моё IT-резюме");
    } else {
      // если записи нет — оставим дефолт
      setResumeData(DEFAULT_RESUME_DATA);
      setResumeTitle("Моё IT-резюме");
    }

    setSaveStatus("idle");
    setSaveError("");
    isHydratingRef.current = false;
  };

  const updateSection = (section, newData) => {
    setResumeData((prev) => {
      // мост about/summary, чтобы шаблоны/экспорт не ломались
      if (section === "profile") {
        const about = newData.about ?? newData.summary ?? "";
        const summary = newData.summary ?? newData.about ?? "";
        return { ...prev, profile: { ...newData, about, summary } };
      }
      return { ...prev, [section]: newData };
    });
  };

  const saveResume = async ({ silent = false } = {}) => {
    if (!user) return;

    try {
      if (!silent) {
        setLoading(true);
        setMessage("");
      }

      setSaveStatus("saving");
      setSaveError("");

      const payload = {
        user_id: user.id,
        title: resumeTitle,
        template: resumeData.template,
        data: resumeData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("resumes")
        .upsert(payload, { onConflict: "user_id" });

      if (!silent) setLoading(false);

      if (error) {
        console.error("❌ Save error:", error);
        setSaveStatus("error");
        setSaveError(error.message);
        if (!silent) setMessage(`Ошибка: ${error.message}`);
        return;
      }

      setSaveStatus("saved");
      if (!silent) setMessage("✅ Резюме сохранено!");
    } catch (e) {
      console.error("❌ Save exception:", e);
      setSaveStatus("error");
      setSaveError(e?.message || "Неизвестная ошибка");
      if (!silent) setMessage(`Ошибка: ${e?.message || "Неизвестная ошибка"}`);
      if (!silent) setLoading(false);
    }
  };

  // Автосохранение с debounce
  useEffect(() => {
    if (!user) return;
    if (isHydratingRef.current) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      // silent автосейв: без алерта "✅ сохранено" на весь экран
      saveResume({ silent: true });
    }, 1000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, resumeTitle, user]);

  // Рекомендации — считаем на лету
  const recommendations = useMemo(() => {
    try {
      return getRecommendations(resumeData);
    } catch (e) {
      console.error("Recommendations error:", e);
      return [];
    }
  }, [resumeData]);

  const renderSaveChip = () => {
    if (saveStatus === "saving") return <Chip size="small" label="Сохранение..." />;
    if (saveStatus === "saved") return <Chip size="small" color="success" label="Сохранено" />;
    if (saveStatus === "error")
      return <Chip size="small" color="error" label={`Ошибка сохранения${saveError ? `: ${saveError}` : ""}`} />;
    return <Chip size="small" variant="outlined" label="Не сохранено" />;
  };

  return (
    <Container sx={{ mt: 4, maxWidth: 1200 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h4">Редактор IT-резюме</Typography>
        {renderSaveChip()}
      </Box>

      <TextField
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

      {/* Рекомендации */}
      <RecommendationPanel recommendations={recommendations} />

      {/* Выбор шаблона */}
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
          <ProfileForm data={resumeData.profile} onChange={(d) => updateSection("profile", d)} />
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
          {loading ? "Сохранение..." : "💾 Сохранить резюме"}
        </Button>

        <Button variant="outlined" size="large" onClick={() => console.log("Current resumeData:", resumeData)}>
          🐛 Debug State
        </Button>

        <Button variant="text" size="large" onClick={loadResumeData} disabled={loading}>
          🔄 Перезагрузить из базы
        </Button>
      </Box>

      {/* DEBUG панель */}
      <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1, fontSize: 12 }}>
        <Typography variant="caption">DEBUG:</Typography>
        <pre style={{ margin: 0 }}>{JSON.stringify({ resumeTitle, resumeData }, null, 2)}</pre>
      </Box>
    </Container>
  );
}
