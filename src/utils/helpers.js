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
