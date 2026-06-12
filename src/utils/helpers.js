export const safeText = (v) => (v == null ? "" : String(v).trim());

export const getProfileAbout = (profile = {}) => {
  // поддержка разных версий: about / summary
  return safeText(profile.about || profile.summary || "");
};

export const getSkillName = (skill) => {
  if (typeof skill === "string") return safeText(skill);
  if (skill && typeof skill === "object") return safeText(skill.name);
  return "";
};

export const getSkillLevel = (skill) => {
  if (skill && typeof skill === "object" && skill.level != null) {
    const n = Number(skill.level);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const getEducationYears = (edu = {}) => {
  if (edu.years) return safeText(edu.years);
  if (edu.year) return safeText(edu.year);
  if (edu.graduationYear) return safeText(edu.graduationYear);
  if (edu.period) return safeText(edu.period);
  if (edu.startYear && edu.endYear) return `${safeText(edu.startYear)}-${safeText(edu.endYear)}`;
  if (edu.startYear) return safeText(edu.startYear);
  return "";
};

export const getWorkPeriod = (exp = {}) => {
  if (exp.period) return safeText(exp.period);

  const start = safeText(exp.startDate || exp.start || exp.from || "");
  const end = safeText(exp.endDate || exp.end || exp.to || (exp.current ? "Настоящее время" : ""));
  if (start && end) return `${start} - ${end}`;
  if (start && exp.current) return `${start} - Настоящее время`;
  return start || end || "";
};

export const normalizeResumeData = (data = {}) => {
  const profile = data.profile || {};

  const skills = Array.isArray(data.skills) ? data.skills : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const github = Array.isArray(data.github) ? data.github : [];

  return {
    profile: {
      ...profile,
      name: safeText(profile.name),
      email: safeText(profile.email),
      phone: safeText(profile.phone),
      about: getProfileAbout(profile),
    },
    skills,
    education,
    experience,
    github,
    template: data.template || "minimalist",
  };
};

export const formatMarkdownLink = (text, url) => {
  const t = safeText(text);
  const u = safeText(url);
  if (!u) return t;
  return `[${t || u}](${u})`;
};

export const hasNumbers = (text) => /\d/.test(safeText(text));
export const wordCount = (text) => safeText(text).split(/\s+/).filter(Boolean).length;

export function getResumeCompleteness(data = {}) {
  const d = normalizeResumeData(data);
  const { profile, skills, education, experience, github } = d;

  const sections = [
    {
      key: "profile",
      label: "Профиль",
      completed: !!safeText(profile.name),
      helperText: safeText(profile.name) ? "ФИО заполнено" : "Добавьте ФИО",
    },
    {
      key: "contacts",
      label: "Контакты",
      completed: !!safeText(profile.email) || !!safeText(profile.phone),
      helperText: safeText(profile.email) || safeText(profile.phone)
        ? `${safeText(profile.email) && "email"}${safeText(profile.email) && safeText(profile.phone) ? " · " : ""}${safeText(profile.phone) && "телефон"}`
        : "Добавьте email или телефон",
    },
    {
      key: "about",
      label: "О себе",
      completed: wordCount(profile.about) >= 12,
      helperText: wordCount(profile.about) >= 12
        ? `${wordCount(profile.about)} слов`
        : `Нужно 12+ слов (сейчас ${wordCount(profile.about)})`,
    },
    {
      key: "skills",
      label: "Навыки",
      completed: skills.length >= 3,
      helperText: skills.length > 0
        ? `${skills.length} навыков`
        : "Добавьте хотя бы 3 навыка",
    },
    {
      key: "experience",
      label: "Опыт",
      completed: experience.length >= 1,
      helperText: experience.length > 0
        ? `${experience.length} записей`
        : "Добавьте опыт или проекты",
    },
    {
      key: "education",
      label: "Образование",
      completed: education.length >= 1,
      helperText: education.length > 0
        ? `${education.length} записей`
        : "Добавьте образование",
    },
    {
      key: "github",
      label: "GitHub",
      completed: github.length >= 1,
      helperText: github.length > 0
        ? `${github.length} проектов`
        : "Подключите GitHub",
    },
  ];

  const completedCount = sections.filter((s) => s.completed).length;
  const score = Math.round((completedCount / sections.length) * 100);

  let status;
  if (score >= 100) status = "complete";
  else if (score >= 70) status = "high";
  else if (score >= 40) status = "medium";
  else status = "low";

  return { score, status, sections };
}
