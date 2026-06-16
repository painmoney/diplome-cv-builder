import { supabase } from "./supabaseClient";

const DEFAULT_RESUME_DATA = {
  profile: {
    name: "", photo: "", about: "", summary: "", email: "", phone: "",
    location: "", githubUrl: "", website: "", telegram: "", linkedin: "", habrCareer: "",
  },
  education: [],
  skills: [],
  experience: [],
  github: [],
  projects: [],
  template: "minimalist",
};

const normalizeProfile = (profile = {}) => {
  const about = profile.about ?? profile.summary ?? "";

  return {
    ...profile,
    about,
    summary: profile.summary ?? about,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    name: profile.name ?? "",
    photo: profile.photo ?? "",
    location: profile.location ?? "",
    githubUrl: profile.githubUrl ?? "",
    website: profile.website ?? "",
    telegram: profile.telegram ?? "",
    linkedin: profile.linkedin ?? "",
    habrCareer: profile.habrCareer ?? "",
  };
};

export const normalizeLoadedResumeData = (data = {}) => {
  const merged = {
    ...DEFAULT_RESUME_DATA,
    ...data,
    profile: normalizeProfile(data.profile || {}),
    education: Array.isArray(data.education) ? data.education : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    github: Array.isArray(data.github) ? data.github : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    template: data.template || "minimalist",
  };

  return merged;
};

const toNumberOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const cleanText = (value) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
};

/**
 * Загружает основное резюме пользователя.
 * В текущей версии используется таблица resumes и агрегированное поле data.
 */
export async function loadUserResume(userId) {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  return {
    ...data,
    data: normalizeLoadedResumeData(data.data || {}),
  };
}

/**
 * Сохраняет основную запись резюме и возвращает созданную/обновлённую строку.
 */
async function upsertResume(userId, title, resumeData) {
  const payload = {
    user_id: userId,
    title,
    template: resumeData.template || "minimalist",
    data: resumeData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("resumes")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Синхронизация profiles.
 * Профиль пользователя хранится отдельно от auth.users,
 * а также дублируется в resume.data.profile для быстрого экспорта.
 */
async function syncProfile(userId, profile = {}) {
  const payload = {
    user_id: userId,
    full_name: cleanText(profile.name),
    avatar_url: cleanText(profile.photo),
    email: cleanText(profile.email),
    phone: cleanText(profile.phone),
    about: cleanText(profile.about ?? profile.summary),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw error;
}

/**
 * Полная замена дочерних записей раздела.
 */
async function replaceRows(tableName, resumeId, rows) {
  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq("resume_id", resumeId);

  if (deleteError) throw deleteError;

  if (!rows.length) return;

  const { error: insertError } = await supabase
    .from(tableName)
    .insert(rows);

  if (insertError) throw insertError;
}

async function syncSkills(resumeId, skills = []) {
  const rows = skills
    .map((skill) => {
      const name = typeof skill === "string" ? skill : skill?.name;
      const rawLevel = Number(skill?.level);
      const level = Number.isFinite(rawLevel)
        ? Math.min(5, Math.max(1, Math.round(rawLevel)))
        : null;

      return {
        resume_id: resumeId,
        skill_name: cleanText(name),
        level,
      };
    })
    .filter((row) => row.skill_name);

  await replaceRows("skills", resumeId, rows);
}

async function syncEducation(resumeId, education = []) {
  const rows = education
    .map((edu) => ({
      resume_id: resumeId,
      institution: cleanText(edu.institution),
      institute: cleanText(edu.institute),
      department: cleanText(edu.department),
      program: cleanText(edu.program),
      degree: cleanText(edu.degree),
      years: cleanText(edu.years || edu.year),
    }))
    .filter((row) => row.institution);

  await replaceRows("education", resumeId, rows);
}

async function syncExperience(resumeId, experience = []) {
  const rows = experience
    .map((exp) => ({
      resume_id: resumeId,
      company: cleanText(exp.company),
      position: cleanText(exp.position) || "Не указано",
      period: cleanText(exp.period),
      description: cleanText(exp.description),
    }))
    .filter((row) => row.company);

  await replaceRows("experience", resumeId, rows);
}

async function syncGitHubProjects(resumeId, github = []) {
  const rows = github
    .map((repo) => ({
      resume_id: resumeId,
      project_name: cleanText(repo.name),
      project_url: cleanText(repo.url),
      description: cleanText(repo.description),
      stars: toNumberOrNull(repo.stars) ?? 0,
    }))
    .filter((row) => row.project_name);

  await replaceRows("github_projects", resumeId, rows);
}

/**
 * Полное сохранение резюме:
 * 1. сохраняет агрегированный JSON в resumes.data;
 * 2. синхронизирует profile;
 * 3. синхронизирует нормализованные таблицы sections.
 */
export async function saveResumeFull(userId, title, rawResumeData) {
  const resumeData = normalizeLoadedResumeData(rawResumeData);

  const resume = await upsertResume(userId, title, resumeData);

  await Promise.all([
  syncProfile(userId, resumeData.profile),
  syncSkills(resume.id, resumeData.skills),
  syncEducation(resume.id, resumeData.education),
  syncExperience(resume.id, resumeData.experience),
  syncGitHubProjects(resume.id, resumeData.github),
]);

return resume;
}