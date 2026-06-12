import {
  ALL_KEYWORDS,
  MULTI_WORD_KEYWORDS,
  RUSSIAN_PHRASES,
  SYNONYMS,
  SUPPRESSIONS,
  CATEGORY_LABELS,
} from "./jobMatchConstants";
import { normalizeResumeData, safeText, getSkillName } from "./helpers";

const TECHNICAL_CATEGORIES = new Set([
  "languages", "frameworks", "databases", "cloud", "tools", "methodologies",
]);

export function getKeywordCategory(keyword) {
  const meta = ALL_KEYWORDS.get(keyword);
  if (meta) return CATEGORY_LABELS[meta.category] || null;
  return null;
}

export function getKeywordLabel(keyword) {
  const meta = ALL_KEYWORDS.get(keyword);
  if (meta) return meta.original;
  for (const [, canonical] of Object.entries(RUSSIAN_PHRASES)) {
    if (canonical.toLowerCase() === keyword) {
      return canonical.charAt(0).toUpperCase() + canonical.slice(1);
    }
  }
  return keyword.charAt(0).toUpperCase() + keyword.slice(1);
}

export function normalizeText(text) {
  return safeText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\-./+#]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripPunctuation(text) {
  return safeText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractKeywordsFromText(text) {
  const normalized = normalizeText(text);
  const keywords = new Set();

  for (const { keyword, original } of MULTI_WORD_KEYWORDS) {
    if (normalized.includes(keyword)) {
      keywords.add(original.toLowerCase());
    }
  }

  const tokens = normalized.split(" ").filter(Boolean);
  for (let raw of tokens) {
    let token = raw.replace(/^[.,;:()[\]{}!?]+|[.,;:()[\]{}!?]+$/g, "");
    const synonym = SYNONYMS[token];
    if (synonym) {
      keywords.add(synonym.toLowerCase());
      continue;
    }
    const meta = ALL_KEYWORDS.get(token);
    if (meta) {
      keywords.add(meta.original.toLowerCase());
    }
  }

  const stripped = stripPunctuation(text);
  for (const [, canonical] of Object.entries(RUSSIAN_PHRASES)) {
    if (stripped.includes(canonical.toLowerCase())) {
      keywords.add(canonical.toLowerCase());
    }
  }

  for (const [parent, children] of Object.entries(SUPPRESSIONS)) {
    if (keywords.has(parent)) {
      for (const child of children) {
        keywords.delete(child);
      }
    }
  }

  return keywords;
}

function buildCategoryMap(keywords) {
  const map = new Map();
  for (const kwLower of keywords) {
    const meta = ALL_KEYWORDS.get(kwLower);
    if (meta) {
      map.set(kwLower, meta.category);
    } else {
      for (const [, canonical] of Object.entries(RUSSIAN_PHRASES)) {
        if (canonical.toLowerCase() === kwLower) {
          if (kwLower === "english" || kwLower === "remote") {
            map.set(kwLower, "requirements");
          } else if (
            kwLower === "testing" || kwLower === "manual testing" ||
            kwLower === "automated testing"
          ) {
            map.set(kwLower, "requirements");
          } else if (kwLower === "experience" || kwLower === "higher education") {
            map.set(kwLower, "requirements");
          } else if (
            kwLower === "responsibility" || kwLower === "organization" ||
            kwLower === "punctuality" || kwLower === "client orientation" ||
            kwLower === "quick learning" || kwLower === "initiative"
          ) {
            map.set(kwLower, "requirements");
          } else {
            map.set(kwLower, "soft_skills");
          }
          break;
        }
      }
      if (!map.has(kwLower)) {
        map.set(kwLower, "unknown");
      }
    }
  }
  return map;
}

export function extractResumeText(resumeData) {
  const data = normalizeResumeData(resumeData);
  const parts = [];

  for (const skill of data.skills) {
    const name = getSkillName(skill);
    if (name) parts.push(name);
  }

  for (const exp of data.experience) {
    if (exp.position) parts.push(exp.position);
    if (exp.company) parts.push(exp.company);
    if (exp.description) parts.push(exp.description);
  }

  if (data.profile.about) parts.push(data.profile.about);

  for (const repo of data.github) {
    if (repo.name) parts.push(repo.name);
    if (repo.description) parts.push(repo.description);
    if (Array.isArray(repo.languages)) {
      parts.push(repo.languages.join(" "));
    }
  }

  return normalizeText(parts.join(" "));
}

function calculateCategoryBreakdown(found, missing, categoryMap) {
  const categories = {};

  for (const kw of found) {
    const cat = categoryMap.get(kw) || "other";
    if (!categories[cat]) categories[cat] = { matched: 0, total: 0 };
    categories[cat].matched++;
    categories[cat].total++;
  }

  for (const kw of missing) {
    const cat = categoryMap.get(kw) || "other";
    if (!categories[cat]) categories[cat] = { matched: 0, total: 0 };
    categories[cat].total++;
  }

  for (const cat of Object.keys(categories)) {
    const { matched, total } = categories[cat];
    categories[cat].percentage = total > 0 ? Math.round((matched / total) * 100) : 0;
  }

  return categories;
}

function generateJobMatchRecommendations(missing, resumeData, categoryMap, totalKeywords) {
  const recs = [];
  const data = normalizeResumeData(resumeData);

  if (totalKeywords === 0) return recs;

  const missingSkills = missing.filter((k) => {
    const cat = categoryMap.get(k);
    return cat === "languages" || cat === "frameworks" || cat === "databases";
  });
  if (missingSkills.length > 0) {
    const names = missingSkills.slice(0, 5).map(getKeywordLabel).join(", ");
    const suffix = missingSkills.length > 5 ? ` и ещё ${missingSkills.length - 5}` : "";
    recs.push({
      type: "skills",
      target: "skills-skill",
      tab: 1,
      text: `Добавьте навыки: ${names}${suffix}`,
    });
  }

  const missingTech = missing.filter((k) => {
    const cat = categoryMap.get(k);
    return cat === "cloud" || cat === "tools" || cat === "methodologies";
  });
  if (missingTech.length > 0) {
    const names = missingTech.slice(0, 3).map(getKeywordLabel).join(", ");
    recs.push({
      type: "experience",
      target: "experience-description",
      tab: 3,
      text: `Упомянуть ${names} в описании опыта работы`,
    });
  }

  if (data.experience.length === 0) {
    recs.push({
      type: "experience",
      target: "experience-company",
      tab: 3,
      text: "Вакансия требует опыт — добавьте записи опыта работы или проекты",
    });
  } else {
    const shortDescs = data.experience.filter((e) => {
      const desc = safeText(e.description);
      return desc && desc.split(/\s+/).length < 20;
    });
    if (shortDescs.length > 0) {
      recs.push({
        type: "experience",
        target: "experience-description",
        tab: 3,
        text: "Некоторые описания опыта слишком короткие. Расширьте: задачи, стек, результаты",
      });
    }
  }

  if (data.github.length === 0) {
    recs.push({
      type: "github",
      target: "github-username",
      tab: 4,
      text: "Подключите GitHub и добавьте релевантные проекты",
    });
  }

  const aboutWords = safeText(data.profile.about).split(/\s+/).filter(Boolean).length;
  if (aboutWords < 12) {
    recs.push({
      type: "profile",
      target: "profile-about",
      tab: 0,
      text: "Добавьте развёрнутое описание «О себе» с указанием ключевых технологий",
    });
  }

  return recs;
}

export function analyzeJobMatch(resumeData, jdText) {
  const jdWordCount = jdText.trim().split(/\s+/).filter(Boolean).length;
  const hasLowConfidence = jdWordCount < 10;
  const data = normalizeResumeData(resumeData);

  const jdKeywords = extractKeywordsFromText(jdText);
  const resumeText = extractResumeText(resumeData);
  const resumeKeywords = extractKeywordsFromText(resumeText);

  if (data.experience.length > 0 && jdKeywords.has("experience")) {
    resumeKeywords.add("experience");
  }

  const found = [];
  const missing = [];

  for (const kw of jdKeywords) {
    if (resumeKeywords.has(kw)) {
      found.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const categoryMap = buildCategoryMap(jdKeywords);
  const totalKeywords = jdKeywords.size;
  const matchedKeywords = found.length;

  const techFound = found.filter((k) => TECHNICAL_CATEGORIES.has(categoryMap.get(k)));
  const techMissing = missing.filter((k) => TECHNICAL_CATEGORIES.has(categoryMap.get(k)));
  const techTotal = techFound.length + techMissing.length;
  const technicalScore = techTotal === 0 ? 0 : Math.round((techFound.length / techTotal) * 100);
  const overallScore = totalKeywords === 0 ? 0 : Math.round((matchedKeywords / totalKeywords) * 100);

  const missingTechnical = missing.filter((k) => TECHNICAL_CATEGORIES.has(categoryMap.get(k)));

  const categoryBreakdown = calculateCategoryBreakdown(found, missing, categoryMap);
  const recommendations = generateJobMatchRecommendations(missing, resumeData, categoryMap, totalKeywords);

  return {
    technicalScore,
    overallScore,
    technicalTotal: techTotal,
    technicalMatched: techFound.length,
    found,
    missing,
    missingTechnical,
    categoryBreakdown,
    recommendations,
    jdWordCount,
    hasLowConfidence,
    totalKeywords,
    matchedKeywords,
  };
}

export { CATEGORY_LABELS };
