import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

import {
  normalizeResumeData,
  getSkillName,
  getSkillLevel,
  getEducationYears,
  getWorkPeriod,
  safeText,
} from "../../utils/helpers";

const TEMPLATE_STYLES = {
  minimalist: {
    accent: "1976D2",
    muted: "555555",
    titlePrefix: "",
    sectionPrefix: "",
  },
  academic: {
    accent: "2E7D32",
    muted: "555555",
    titlePrefix: "",
    sectionPrefix: "",
  },
  github: {
    accent: "0969DA",
    muted: "57606A",
    titlePrefix: "",
    sectionPrefix: "",
  },
};

const getTemplateStyle = (template = "minimalist") => {
  return TEMPLATE_STYLES[template] || TEMPLATE_STYLES.minimalist;
};

const makeParagraph = (text, options = {}) => {
  const value = safeText(text);
  if (!value) return null;

  return new Paragraph({
    spacing: { after: options.after ?? 160 },
    alignment: options.alignment,
    children: [
      new TextRun({
        text: value,
        bold: options.bold || false,
        italics: options.italics || false,
        size: options.size || 22,
        color: options.color,
      }),
    ],
  });
};

const makeHeading = (text, color = "1976D2", prefix = "") =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    border: {
      bottom: {
        color,
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: `${prefix}${text}`,
        bold: true,
        size: 28,
        color,
      }),
    ],
  });

const makeSubheading = (text) =>
  new Paragraph({
    spacing: { before: 120, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
      }),
    ],
  });

const makeBullet = (text) => {
  const value = safeText(text);
  if (!value) return null;

  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: value,
        size: 22,
      }),
    ],
  });
};

const splitDescriptionToBullets = (text) => {
  const value = safeText(text);
  if (!value) return [];

  const parts = value
    .split(/\n|•|- /g)
    .map((item) => safeText(item))
    .filter(Boolean);

  return parts.length ? parts : [value];
};

const compact = (items) => items.filter(Boolean);

export const buildDocxDocument = (resumeData, template = "minimalist") => {
  const data = normalizeResumeData(resumeData);
  const { profile, skills, education, experience, github } = data;

  const style = getTemplateStyle(template);
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: profile.name || "Без имени",
          bold: true,
          size: 36,
          color: style.accent,
        }),
      ],
    })
  );

  const contacts = [];
  if (profile.email) contacts.push(`Email: ${profile.email}`);
  if (profile.phone) contacts.push(`Телефон: ${profile.phone}`);
  if (profile.githubUrl) contacts.push(`GitHub: ${profile.githubUrl}`);
  if (profile.website) contacts.push(`Website: ${profile.website}`);

  if (contacts.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 220 },
        children: [
          new TextRun({
            text: contacts.join("  |  "),
            size: 20,
            color: style.muted,
          }),
        ],
      })
    );
  }

  if (profile.about) {
    children.push(makeHeading("О себе", style.accent, style.sectionPrefix));
    children.push(makeParagraph(profile.about));
  }

  if (skills.length) {
    children.push(makeHeading("Навыки", style.accent, style.sectionPrefix));

    skills.forEach((skill) => {
      const name = getSkillName(skill);
      const level = getSkillLevel(skill);
      const text = level ? `${name} — ${level}/5` : name;
      children.push(makeBullet(text));
    });
  }

  if (experience.length) {
    children.push(makeHeading("Опыт работы", style.accent, style.sectionPrefix));

    experience.forEach((exp) => {
      const position = safeText(exp.position) || "Должность";
      const company = safeText(exp.company);
      const period = getWorkPeriod(exp);

      children.push(
        makeSubheading(`${position}${company ? ` — ${company}` : ""}`)
      );

      if (period) {
        children.push(
          makeParagraph(period, {
            italics: true,
            size: 20,
            after: 80,
            color: style.muted,
          })
        );
      }

      splitDescriptionToBullets(exp.description).forEach((item) => {
        children.push(makeBullet(item));
      });
    });
  }

  if (education.length) {
    children.push(makeHeading("Образование", style.accent, style.sectionPrefix));

    education.forEach((edu) => {
      const institution = safeText(edu.institution) || "Учебное заведение";
      const institute = safeText(edu.institute);
      const department = safeText(edu.department);
      const program = safeText(edu.program);
      const degree = safeText(edu.degree);
      const years = getEducationYears(edu);

      children.push(
        makeSubheading(`${institution}${years ? ` (${years})` : ""}`)
      );

      if (institute) {
        children.push(makeParagraph(`Институт: ${institute}`, { size: 20, after: 80 }));
      }

      if (department) {
        children.push(makeParagraph(`Кафедра: ${department}`, { size: 20, after: 80 }));
      }

      if (program) {
        children.push(
          makeParagraph(`Направление подготовки/специальности: ${program}`, {
            size: 20,
            after: 80,
          })
        );
      }

      if (degree) {
        children.push(makeParagraph(`Степень/сертификат: ${degree}`, { size: 20 }));
      }

      if (edu.description) {
        children.push(makeParagraph(edu.description, { size: 20 }));
      }
    });
  }

  if (github.length) {
    const githubHeading =
      template === "github" ? "GitHub repositories" : "GitHub проекты";

    children.push(makeHeading(githubHeading, style.accent, style.sectionPrefix));

    github.forEach((repo) => {
      const name = safeText(repo.name);
      const url = safeText(repo.url);
      const stars = repo.stars != null ? Number(repo.stars) : null;
      const desc = safeText(repo.description);

      children.push(
        makeSubheading(
          `${name || "Репозиторий"}${
            Number.isFinite(stars) ? ` — ${stars} stars` : ""
          }`
        )
      );

      if (desc) children.push(makeParagraph(desc, { size: 20 }));

      if (url) {
        children.push(
          makeParagraph(url, {
            size: 20,
            color: style.accent,
          })
        );
      }
    });
  }

  return new Document({
    creator: "CV Builder",
    title: profile.name ? `Резюме ${profile.name}` : "Резюме",
    description: "Резюме, сформированное в CV Builder",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            },
          },
        },
        children: compact(children),
      },
    ],
  });
};

export const exportToDocx = async (resumeData, template = "minimalist") => {
  try {
    const doc = buildDocxDocument(resumeData, template);
    const blob = await Packer.toBlob(doc);

    const name =
      (resumeData?.profile?.name || "resume")
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, "_")
        .trim() || "resume";

    saveAs(blob, `${name}_${Date.now()}.docx`);

    return { success: true, message: "DOCX успешно сохранён!" };
  } catch {
    return { success: false, message: "Ошибка при создании DOCX" };
  }
};