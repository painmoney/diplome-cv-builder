import { saveAs } from "file-saver";
import {
  normalizeResumeData,
  getSkillName,
  getSkillLevel,
  getEducationYears,
  getWorkPeriod,
  formatMarkdownLink,
  safeText,
} from "../../utils/helpers";

const bulletsFromText = (text) => {
  const t = safeText(text);
  if (!t) return [];
  // если пользователь пишет предложениями — делаем 1-2 буллета
  const parts = t
    .split(/\n|•|- /g)
    .map((p) => safeText(p))
    .filter(Boolean);
  return parts.length ? parts : [t];
};

export const buildMarkdown = (resumeData) => {
  const data = normalizeResumeData(resumeData);
  const { profile, skills, education, experience, github } = data;

  const lines = [];

  // Header
  lines.push(`# ${profile.name || "Без имени"}`);
  lines.push("");

  // Contacts
  const contacts = [];
  if (profile.email) contacts.push(`Email: ${formatMarkdownLink(profile.email, `mailto:${profile.email}`)}`);
  if (profile.phone) contacts.push(`Телефон: ${profile.phone}`);
  if (profile.githubUrl) contacts.push(`GitHub: ${formatMarkdownLink(profile.githubUrl, profile.githubUrl)}`);
  if (profile.website) contacts.push(`Website: ${formatMarkdownLink(profile.website, profile.website)}`);

  if (contacts.length) {
    lines.push(contacts.join(" • "));
    lines.push("");
  }

  // About
  if (profile.about) {
    lines.push(`## О себе`);
    lines.push(profile.about);
    lines.push("");
  }

  // Skills
  if (skills.length) {
    lines.push(`## Навыки`);
    // показываем уровень, если есть
    const skillLines = skills.map((s) => {
      const name = getSkillName(s);
      const lvl = getSkillLevel(s);
      return lvl ? `- ${name} — ${lvl}/5` : `- ${name}`;
    });
    lines.push(...skillLines);
    lines.push("");
  }

  // Experience
  if (experience.length) {
    lines.push(`## Опыт`);
    experience.forEach((exp) => {
      const pos = safeText(exp.position);
      const comp = safeText(exp.company);
      const period = getWorkPeriod(exp);

      lines.push(`### ${pos || "Должность"}${comp ? ` — ${comp}` : ""}`);
      if (period) lines.push(`_${period}_`);

      const bullets = bulletsFromText(exp.description);
      if (bullets.length) {
        bullets.forEach((b) => lines.push(`- ${b}`));
      }
      lines.push("");
    });
  }

  // Education
  if (education.length) {
    lines.push(`## Образование`);
    education.forEach((edu) => {
      const inst = safeText(edu.institution);
      const degree = safeText(edu.degree);
      const years = getEducationYears(edu);

      lines.push(`- **${degree || "Обучение"}**${inst ? `, ${inst}` : ""}${years ? ` (${years})` : ""}`);
    });
    lines.push("");
  }

  // GitHub Projects
  if (github.length) {
    lines.push(`## GitHub проекты`);
    github.forEach((repo) => {
      const name = safeText(repo.name);
      const url = safeText(repo.url);
      const stars = repo.stars != null ? Number(repo.stars) : null;
      const desc = safeText(repo.description);

      const title = url ? formatMarkdownLink(name, url) : name;
      lines.push(`- ${title}${Number.isFinite(stars) ? ` ⭐ ${stars}` : ""}${desc ? ` — ${desc}` : ""}`);
    });
    lines.push("");
  }

  return lines.join("\n");
};

export const exportToMarkdown = async (resumeData) => {
  try {
    const md = buildMarkdown(resumeData);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const name = (resumeData?.profile?.name || "resume").replace(/\s+/g, "_");
    saveAs(blob, `${name}_${Date.now()}.md`);
    return { success: true, message: "Markdown успешно сохранён!" };
  } catch (e) {
    console.error("Markdown Export Error:", e);
    return { success: false, message: "Ошибка при создании Markdown" };
  }
};
