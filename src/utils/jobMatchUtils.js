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

export function buildResumeEvidenceMap(resumeData) {
  const data = normalizeResumeData(resumeData);

  const experienceParts = [];
  for (const exp of data.experience) {
    if (exp.position) experienceParts.push(exp.position);
    if (exp.company) experienceParts.push(exp.company);
    if (exp.description) experienceParts.push(exp.description);
  }

  const skillsParts = [];
  for (const skill of data.skills) {
    const name = getSkillName(skill);
    if (name) skillsParts.push(name);
  }

  const projectsParts = [];
  const githubParts = [];
  for (const repo of data.github) {
    if (repo.name) projectsParts.push(repo.name);
    if (repo.description) projectsParts.push(repo.description);
    if (repo.url) githubParts.push(repo.url);
    if (Array.isArray(repo.languages)) {
      projectsParts.push(repo.languages.join(" "));
    }
  }

  const profileParts = [];
  if (data.profile.about) profileParts.push(data.profile.about);
  if (data.profile.summary) profileParts.push(data.profile.summary);

  return {
    experienceText: normalizeText(experienceParts.join(" ")),
    skillsText: normalizeText(skillsParts.join(" ")),
    projectsText: normalizeText(projectsParts.join(" ")),
    githubText: normalizeText(githubParts.join(" ")),
    profileText: normalizeText(profileParts.join(" ")),
    allResumeText: extractResumeText(resumeData),
  };
}

export function classifyKeywordEvidence(keyword, evidenceMap) {
  const kwLower = keyword.toLowerCase();
  let status = "missing";
  let source = "none";

  if (evidenceMap.experienceText.includes(kwLower)) {
    status = "confirmed_experience";
    source = "experience";
  } else if (evidenceMap.projectsText.includes(kwLower) || evidenceMap.githubText.includes(kwLower)) {
    status = "confirmed_project";
    source = evidenceMap.projectsText.includes(kwLower) ? "projects" : "github";
  } else if (evidenceMap.skillsText.includes(kwLower)) {
    status = "declared_skill";
    source = "skills";
  } else if (evidenceMap.profileText.includes(kwLower)) {
    status = "weak_match";
    source = "profile";
  }

  let recommendationLevel = "do_not_add_without_experience";
  if (status === "confirmed_experience") {
    recommendationLevel = "safe_to_use";
  } else if (status === "confirmed_project") {
    recommendationLevel = "safe_to_use";
  } else if (status === "declared_skill") {
    recommendationLevel = "use_as_skill_only";
  } else if (status === "weak_match") {
    recommendationLevel = "use_as_skill_only";
  }

  return { keyword, status, source, recommendationLevel };
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

function generateJobMatchRecommendations(missing, resumeData, categoryMap, totalKeywords, evidenceMatches = []) {
  const recs = [];
  const data = normalizeResumeData(resumeData);

  if (totalKeywords === 0) return recs;

  // Evidence-based recommendations
  const confirmedExp = evidenceMatches.filter((e) => e.status === "confirmed_experience");
  if (confirmedExp.length > 0) {
    const names = confirmedExp.slice(0, 3).map((e) => getKeywordLabel(e.keyword)).join(", ");
    const suffix = confirmedExp.length > 3 ? ` и ещё ${confirmedExp.length - 3}` : "";
    const isPlural = confirmedExp.length > 1;
    const verb = isPlural ? "подтверждены" : "подтверждён";
    const verb2 = isPlural ? "соответствуют" : "соответствует";
    recs.push({
      type: "evidence_confirmed",
      target: "",
      tab: -1,
      text: `${names}${suffix} ${verb} в опыте и ${verb2} требованиям вакансии.`,
    });
  }

  const confirmedProj = evidenceMatches.filter((e) => e.status === "confirmed_project");
  if (confirmedProj.length > 0) {
    const names = confirmedProj.slice(0, 3).map((e) => getKeywordLabel(e.keyword)).join(", ");
    const suffix = confirmedProj.length > 3 ? ` и ещё ${confirmedProj.length - 3}` : "";
    const isPlural = confirmedProj.length > 1;
    const verb = isPlural ? "подтверждены" : "подтверждён";
    const verb2 = isPlural ? "соответствуют" : "соответствует";
    recs.push({
      type: "evidence_confirmed",
      target: "",
      tab: -1,
      text: `${names}${suffix} ${verb} в проектах или GitHub и ${verb2} требованиям вакансии.`,
    });
  }

  const declared = evidenceMatches.filter((e) => e.status === "declared_skill");
  if (declared.length > 0) {
    const names = declared.slice(0, 3).map((e) => getKeywordLabel(e.keyword)).join(", ");
    const suffix = declared.length > 3 ? ` и ещё ${declared.length - 3}` : "";
    const isPlural = declared.length > 1;
    const word = isPlural ? "указаны" : "указан";
    const suffix2 = isPlural ? "найдены" : "найден";
    recs.push({
      type: "evidence_declared",
      target: "experience-description",
      tab: 3,
      text: `${names}${suffix} ${word} в навыках, но не ${suffix2} в опыте или проектах. При наличии реального опыта можно отразить его в описании опыта или проекта.`,
    });
  }

  const missingE = evidenceMatches.filter((e) => e.status === "missing");
  if (missingE.length > 0) {
    const names = missingE.slice(0, 3).map((e) => getKeywordLabel(e.keyword)).join(", ");
    const suffix = missingE.length > 3 ? ` и ещё ${missingE.length - 3}` : "";
    const isPlural = missingE.length > 1;
    const foundWord = isPlural ? "найдены" : "найден";
    const skillWord = isPlural ? "навыки" : "навык";
    recs.push({
      type: "evidence_missing",
      target: "skills-skill",
      tab: 1,
      text: `${names}${suffix} не ${foundWord} в резюме. Добавляйте ${skillWord} только при наличии реального опыта.`,
    });
  }

  // Legacy recommendations (kept for backward compatibility)
  const missingSkills = missing.filter((k) => {
    const cat = categoryMap.get(k);
    return cat === "languages" || cat === "frameworks" || cat === "databases";
  });
  if (missingSkills.length > 0 && missingE.length === 0) {
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
  if (missingTech.length > 0 && missingE.length === 0) {
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

const EVIDENCE_WEIGHTS = {
  confirmed_experience: 1.0,
  confirmed_project: 0.8,
  declared_skill: 0.5,
  weak_match: 0.25,
  missing: 0,
};

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

  // Evidence-based classification
  const evidenceMap = buildResumeEvidenceMap(resumeData);
  const evidenceMatches = [];
  const confirmedExperience = [];
  const confirmedProjects = [];
  const declaredOnly = [];
  const weakMatches = [];
  const missingEvidence = [];
  const unsafeToAdd = [];

  for (const kw of jdKeywords) {
    const evidence = classifyKeywordEvidence(kw, evidenceMap);
    evidenceMatches.push(evidence);

    switch (evidence.status) {
      case "confirmed_experience":
        confirmedExperience.push(kw);
        break;
      case "confirmed_project":
        confirmedProjects.push(kw);
        break;
      case "declared_skill":
        declaredOnly.push(kw);
        break;
      case "weak_match":
        weakMatches.push(kw);
        break;
      case "missing":
        missingEvidence.push(kw);
        unsafeToAdd.push(kw);
        break;
    }
  }

  // Calculate evidence score
  const evidenceScore = totalKeywords === 0
    ? 0
    : Math.round(
        (evidenceMatches.reduce((sum, e) => sum + EVIDENCE_WEIGHTS[e.status], 0) / totalKeywords) * 100
      );

  const recommendations = generateJobMatchRecommendations(
    missing, resumeData, categoryMap, totalKeywords, evidenceMatches
  );

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
    // Evidence-based fields
    evidenceMatches,
    confirmedExperience,
    confirmedProjects,
    declaredOnly,
    weakMatches,
    missingEvidence,
    unsafeToAdd,
    evidenceScore,
  };
}

export { CATEGORY_LABELS };
