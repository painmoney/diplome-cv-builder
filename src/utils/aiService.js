import {
  getCoverLetterMode,
  buildWeakMatchCoverLetter,
  buildSafeCoverLetterFallback,
  buildJobMatchAdviceFallback,
  validateCoverLetterText,
  validateJobMatchAdviceText,
} from "./coverLetterSafetyUtils";

const AI_MODEL_PRIMARY = "openai/gpt-4o-mini";

function isModelError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("unsupported") ||
    msg.includes("invalid model") ||
    msg.includes("model not found") ||
    msg.includes("404") ||
    msg.includes("400")
  );
}

function isLimitError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("too many requests") ||
    msg.includes("limit") ||
    msg.includes("rate limit")
  );
}

function isAuthError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return msg.includes("auth") || msg.includes("login") || msg.includes("unauthorized");
}

export function normalizePuterAIError(err) {
  if (isLimitError(err)) {
    return "Лимит AI-сервиса временно исчерпан. Попробуйте позже.";
  }
  if (isAuthError(err)) {
    return "Для AI-генерации нужно войти в Puter.";
  }
  return "AI-сервис временно недоступен. Попробуйте позже.";
}

export async function callPuterAI(prompt, options = {}) {
  if (!isAIAvailable()) {
    throw new Error("AI-сервис недоступен");
  }

  try {
    return await window.puter.ai.chat(prompt, {
      model: AI_MODEL_PRIMARY,
      ...options,
    });
  } catch (primaryErr) {
    if (isLimitError(primaryErr)) {
      throw new Error(normalizePuterAIError(primaryErr), { cause: primaryErr });
    }
    if (isModelError(primaryErr)) {
      try {
        return await window.puter.ai.chat(prompt, options);
      } catch (fallbackErr) {
        throw new Error(normalizePuterAIError(fallbackErr), { cause: fallbackErr });
      }
    }
    throw new Error(normalizePuterAIError(primaryErr), { cause: primaryErr });
  }
}

export function isAIAvailable() {
  return (
    typeof window !== "undefined" &&
    typeof window.puter !== "undefined" &&
    typeof window.puter.ai !== "undefined" &&
    typeof window.puter.ai.chat === "function"
  );
}

export function extractAIText(response) {
  if (!response) return "";
  const msg = response.message || response;
  if (typeof msg === "string") return msg;
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.content) && msg.content.length > 0) {
    return msg.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .filter(Boolean)
      .join("");
  }
  if (typeof msg.text === "string") return msg.text;
  return "";
}

/* ── About-me helpers ─────────────────────────────────────────────── */

function normalizeAboutText(value) {
  return String(value || "").toLowerCase().replace(/ё/g, "е").trim();
}

function getAboutSkillName(skill) {
  if (typeof skill === "string") return skill;
  return skill?.name || skill?.skill_name || "";
}

function getExperienceText(experience) {
  return (experience || [])
    .map((e) => `${e.position || ""} ${e.company || ""} ${e.description || ""}`)
    .join(" ");
}

function getGithubText(github) {
  return (github || [])
    .map((g) => `${g.name || ""} ${g.description || ""}`)
    .join(" ");
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Do not use simple includes for tech matching: Java must not match JavaScript.
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasExactTerm(text, term) {
  const normalizedText = normalizeAboutText(text);
  const normalizedTerm = normalizeAboutText(term);
  if (!normalizedTerm) return false;
  const escaped = escapeRegExp(normalizedTerm);
  const regex = new RegExp(`(^|[^a-zа-я0-9+#.])${escaped}($|[^a-zа-я0-9+#.])`, "i");
  return regex.test(normalizedText);
}

const SKILL_CANONICAL_ALIASES = {
  "js": "javascript",
  "react.js": "react",
  "reactjs": "react",
  "mui": "material ui",
};

function normalizeSkillCanonical(name) {
  const lower = normalizeAboutText(name);
  return SKILL_CANONICAL_ALIASES[lower] || lower;
}

/* ── Profile detection (universal, confirmed-only primary) ────────── */

const PROFILE_KEYWORDS = {
  frontend: [
    "frontend", "front-end", "react", "vue", "angular", "javascript", "typescript",
    "html", "css", "ui", "интерфейс", "пользовательский интерфейс",
    "верстка", "вёрстка", "spa", "material ui", "mui", "vite",
  ],
  backendHard: [
    "backend", "back-end", "бекенд", "бэкенд", "сервер", "серверная логика", "серверной логики",
    "java", "spring", "spring boot", "node.js", "nodejs",
    "express", "nestjs", "django", "fastapi", "laravel", "jpa", "hibernate",
  ],
  backendWeak: [
    "api", "rest", "graphql", "postgresql", "mysql", "mongodb", "supabase",
  ],
  qa: [
    "qa", "тестирование", "тестировщик", "автотест", "автотесты",
    "selenium", "playwright", "cypress", "jest", "postman", "test case", "bug",
  ],
  devops: [
    "devops", "docker", "kubernetes", "ci/cd", "gitlab ci", "github actions",
    "nginx", "linux", "terraform", "ansible", "deploy", "деплой", "pipeline",
  ],
  data: [
    "data", "данные", "аналитик", "analytics", "sql", "pandas",
    "numpy", "machine learning", "ml", "model", "модель", "etl", "bi", "power bi",
  ],
  mobile: [
    "mobile", "android", "ios", "react native", "flutter", "kotlin", "swift",
  ],
  design: [
    "designer", "дизайнер", "figma", "ux", "ui/ux", "prototype", "прототип",
  ],
};

const PROFILE_LABELS = {
  frontend: "frontend-разработчик",
  backend: "backend-разработчик",
  fullstack: "fullstack-разработчик",
  qa: "QA-специалист",
  devops: "DevOps-инженер",
  data: "data/analytics-специалист",
  mobile: "mobile-разработчик",
  design: "UI/UX-дизайнер",
  unknown: "IT-специалист",
};

function getProfileLabel(profileType) {
  return PROFILE_LABELS[profileType.primary] || "IT-специалист";
}

function countProfileHits(text, keywords) {
  const lower = normalizeAboutText(text);
  return keywords.reduce((acc, kw) => acc + (hasExactTerm(lower, kw) ? 1 : 0), 0);
}

function detectProfileType(experienceText, githubText, skills) {
  const confirmedScores = {};
  const skillScores = {};
  // All profile categories for iteration (backend counts as one)
  const profileKeys = ["frontend", "backend", "qa", "devops", "data", "mobile", "design"];
  for (const profile of profileKeys) {
    confirmedScores[profile] = 0;
    skillScores[profile] = 0;
  }

  // Frontend confirmed
  confirmedScores.frontend += countProfileHits(experienceText, PROFILE_KEYWORDS.frontend) * 3;
  confirmedScores.frontend += countProfileHits(githubText, PROFILE_KEYWORDS.frontend) * 2;

  // Backend: hard keywords are required to establish backend confirmedScore
  const beHardExp = countProfileHits(experienceText, PROFILE_KEYWORDS.backendHard);
  const beHardGh = countProfileHits(githubText, PROFILE_KEYWORDS.backendHard);
  const backendHardConfirmed = (beHardExp + beHardGh) > 0;

  confirmedScores.backend += beHardExp * 3;
  confirmedScores.backend += beHardGh * 2;

  // Weak backend keywords only add score if hard backend is already confirmed
  if (backendHardConfirmed) {
    confirmedScores.backend += countProfileHits(experienceText, PROFILE_KEYWORDS.backendWeak) * 3;
    confirmedScores.backend += countProfileHits(githubText, PROFILE_KEYWORDS.backendWeak) * 2;
  }

  // Other profiles confirmed
  for (const profile of ["qa", "devops", "data", "mobile", "design"]) {
    confirmedScores[profile] += countProfileHits(experienceText, PROFILE_KEYWORDS[profile]) * 3;
    confirmedScores[profile] += countProfileHits(githubText, PROFILE_KEYWORDS[profile]) * 2;
  }

  // Skills = informational only, never drives primary
  const skillsText = (skills || []).map(getAboutSkillName).join(" ");
  skillScores.frontend = countProfileHits(skillsText, PROFILE_KEYWORDS.frontend) * 1;
  skillScores.backend = countProfileHits(skillsText, [...PROFILE_KEYWORDS.backendHard, ...PROFILE_KEYWORDS.backendWeak]) * 1;
  for (const profile of ["qa", "devops", "data", "mobile", "design"]) {
    skillScores[profile] = countProfileHits(skillsText, PROFILE_KEYWORDS[profile]) * 1;
  }

  // Primary is determined ONLY by confirmedScores
  const sortedConfirmed = Object.entries(confirmedScores).sort((a, b) => b[1] - a[1]);
  const [topProfile, topScore] = sortedConfirmed[0];

  if (topScore === 0) {
    return { primary: "unknown", secondary: [], confirmedScores, skillScores, backendHardConfirmed };
  }

  // Fullstack: frontend confirmed AND backend hard keywords confirmed
  const feConfirmed = confirmedScores.frontend || 0;
  if (feConfirmed > 0 && backendHardConfirmed) {
    return {
      primary: "fullstack",
      secondary: ["frontend", "backend"],
      confirmedScores,
      skillScores,
      backendHardConfirmed,
    };
  }

  // Secondary: profiles with confirmedScore >= 40% of primary and >= 3
  const threshold = Math.max(3, Math.floor(topScore * 0.4));
  const secondary = sortedConfirmed
    .filter(([p, s]) => p !== topProfile && s >= threshold)
    .map(([p]) => p);

  return { primary: topProfile, secondary, confirmedScores, skillScores, backendHardConfirmed };
}

/* ── Skill filtering ──────────────────────────────────────────────── */

function isConfirmedInContext(skillName, experienceText, githubText, projectsText = "") {
  const canonical = normalizeSkillCanonical(skillName);
  return (
    hasExactTerm(experienceText, skillName) ||
    hasExactTerm(githubText, skillName) ||
    hasExactTerm(projectsText, skillName) ||
    hasExactTerm(experienceText, canonical) ||
    hasExactTerm(githubText, canonical) ||
    hasExactTerm(projectsText, canonical)
  );
}

// Split skills into 3 groups by evidence source
function splitSkillConfirmation(skills, experienceText, githubText, projectsText = "") {
  const experienceConfirmed = [];
  const projectConfirmed = [];
  const unconfirmed = [];

  for (const skill of skills || []) {
    const name = getAboutSkillName(skill);
    if (!name) continue;
    if (isConfirmedInContext(name, experienceText, githubText, "")) {
      experienceConfirmed.push(name);
    } else if (isConfirmedInContext(name, "", "", projectsText)) {
      projectConfirmed.push(name);
    } else {
      unconfirmed.push(name);
    }
  }
  return { experienceConfirmed, projectConfirmed, unconfirmed };
}

// Skills that appear in experience/github/projects → confirmed
function buildConfirmedTechnologies(skills, experienceText, githubText, projectsText = "") {
  return (skills || [])
    .map(getAboutSkillName)
    .filter((name) => name && isConfirmedInContext(name, experienceText, githubText, projectsText));
}

// Skills that do NOT appear in experience/github/projects → unconfirmed
function buildUnconfirmedSkills(skills, experienceText, githubText, projectsText = "") {
  return (skills || [])
    .map(getAboutSkillName)
    .filter((name) => name && !isConfirmedInContext(name, experienceText, githubText, projectsText));
}

// Skills not confirmed AND not belonging to active profile → excluded from summary
function buildExcludedForSummarySkills(skills, experienceText, githubText, profileType) {
  const activeProfiles = new Set([profileType.primary, ...profileType.secondary]);
  const allBackendKw = [...PROFILE_KEYWORDS.backendHard, ...PROFILE_KEYWORDS.backendWeak];

  return skills
    .map(getAboutSkillName)
    .filter((name) => {
      if (!name) return false;
      if (isConfirmedInContext(name, experienceText, githubText)) return false;

      const canonical = normalizeSkillCanonical(name);

      // For unknown profile: exclude everything unconfirmed
      if (profileType.primary === "unknown") return true;

      // Check if skill belongs to any active confirmed profile
      const profileKeywordMap = {
        frontend: PROFILE_KEYWORDS.frontend,
        backend: allBackendKw,
        qa: PROFILE_KEYWORDS.qa,
        devops: PROFILE_KEYWORDS.devops,
        data: PROFILE_KEYWORDS.data,
        mobile: PROFILE_KEYWORDS.mobile,
        design: PROFILE_KEYWORDS.design,
      };

      for (const [profile, keywords] of Object.entries(profileKeywordMap)) {
        if (!activeProfiles.has(profile)) continue;
        const matches = keywords.some((kw) => {
          const kwCanon = normalizeSkillCanonical(kw);
          return canonical === kwCanon || hasExactTerm(canonical, kwCanon);
        });
        if (matches) return false;
      }

      return true;
    })
    .filter(Boolean);
}

function buildDetailedSkillsForPrompt(skills, experienceText, githubText, excludedSet) {
  return (skills || [])
    .map((s) => {
      const name = getAboutSkillName(s);
      if (!name) return "";
      if (excludedSet.has(normalizeAboutText(name))) return "";
      const level = Number(s.level) || 0;
      let lvl = "";
      if (level >= 1 && level <= 2) lvl = " (базовый)";
      else if (level === 3) lvl = " (средний)";
      else if (level >= 4) lvl = " (продвинутый)";
      return `- ${name}${lvl}`;
    })
    .filter(Boolean)
    .join("\n");
}

/* ── Validation ───────────────────────────────────────────────────── */

const BANNED_PHRASES = [
  // Motivational / overclaim
  "стремлюсь", "ориентирован на", "мой подход", "готов развиваться",
  "хочу развиваться", "высокими требованиями", "высокие требования",
  "повышению стабильности", "повышение стабильности",
  "повышению производительности", "повышение производительности",
  "оптимизации кода", "оптимизация кода",
  "значительно", "высокоэффектив", "отзывчив",
  "глубокие знания", "эксперт", "профессионал высокого уровня",
  // Overclaim terms
  "обладаю", "продвинут", "уверенно", "эффективно",
  "полноценн", "масштабируем", "надежн", "надёжн",
  "эстетически", "позволяет", "помогает",
  "ключевые технологии",
  // Result-claim stems
  "что позволило", "позволило создать", "позволило",
  "интерактивные и функциональные",
  "подтвержденным опытом работы", "подтверждённым опытом работы",
  // Motivational / job-seeking
  "ищу возможности", "ищу", "готов изучать", "готова изучать",
  "интересных проектах", "интересные проекты",
  "актуальных задач", "актуальные задачи",
  "изучать", "интересуюсь",
  // Stems from real test failures
  "с фокусом на", "уверенно работаю", "способствует",
  "высокую производительность", "высокая производительность",
  "современными технологиями", "современные технологии",
  "продвинутые навыки", "продвинутыми навыками",
  "что обеспечивает", "что способствует",
  "эстетически привлекательн",
  "что дает возможность", "что даёт возможность",
  "с опытом в создании",
  // Case B result-claim
  "основной акцент", "высококачественную", "высококачественн",
  "реализацию функциональности",
  // Case D motivational
  "открыт к новым возможностям", "открыта к новым возможностям",
  "новым возможностям", "в сфере разработки",
  "в рамках всего стека", "всего стека технологий", "всего стека",
  "участвовал в создании веб-приложений", "участвовала в создании веб-приложений",
  // Years of experience hallucination
  "лет опыта", "года опыта", "год опыта",
  "лет стажа", "года стажа", "год стажа",
  // Additional overclaim
  "что дало мне возможность", "дало мне возможность",
  // Self-development / motivational
  "углубляю знания", "углубляет знания", "углубляю",
  "современных технологиях", "современные технологии",
  "с акцентом на frontend и backend", "с акцентом на",
  "удобных решений", "удобные решения",
  "развиваю навыки", "изучаю",
];

const MOTIVATIONAL_STEMS = [
  "стрем", "развива", "изуч", "углубля",
  "нацелен", "нацелена", "открыт", "готов",
  "ищу", "современн", "мотивац",
];

const VAGUE_RESULT_STEMS = [
  "решения задач", "решать задачи",
  "применение технолог", "создание удобн",
  "удобн", "функциональн",
];

const FULLSTACK_TERMS = ["fullstack", "full stack", "фулстек", "фуллстек"];
const BACKEND_TERMS = ["backend", "бекенд", "бэкенд", "серверной логики", "серверная логика", "для разработки серверной"];
const FRONTEND_TERMS = ["frontend-разработчик", "front-end", "фронтенд-разработчик"];

function isProfileAllowed(profileType, profileName) {
  const { primary, secondary } = profileType;
  if (profileName === "fullstack") return primary === "fullstack";
  if (profileName === "backend") return primary === "backend" || primary === "fullstack" || secondary.includes("backend");
  if (profileName === "frontend") return primary === "frontend" || primary === "fullstack" || secondary.includes("frontend");
  return false;
}

const UNKNOWN_PROFILE_BLOCKED = [
  "разработчик", "backend-разработчик", "frontend-разработчик",
  "fullstack-разработчик", "опыт работы", "создаю", "разрабатываю",
  "разрабатывал", "создавал",
  "ищу", "готов", "готова", "изучать", "интересуюсь", "проекты",
  "открыт", "открыта", "возможност", "сфера разработки", "сфере разработки",
];

function validateGeneratedAboutMe(text, profileType, excludedForSummarySkills, unconfirmedSkills, projectConfirmedSkills = []) {
  const violations = [];

  if (!text || text.trim().length < 20) {
    violations.push("текст слишком короткий");
    return { ok: false, violations };
  }

  const sentences = splitSentences(text);
  if (sentences.length > 3) {
    violations.push(`слишком много предложений: ${sentences.length} (допустимо 2–3)`);
  }

  const lower = normalizeAboutText(text);

  // Banned phrases
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(normalizeAboutText(phrase))) {
      violations.push(`запрещённая фраза: "${phrase}"`);
    }
  }

  // Motivational stems (catch variations like "продолжаю развиваться", "нацелен на")
  for (const stem of MOTIVATIONAL_STEMS) {
    if (lower.includes(stem)) {
      violations.push(`мотивационная/размытая формулировка: "${stem}"`);
    }
  }

  // Vague result stems
  for (const stem of VAGUE_RESULT_STEMS) {
    if (lower.includes(stem)) {
      violations.push(`размытая формулировка результата: "${stem}"`);
    }
  }

  // Years of experience hallucination (regex)
  const yearPatterns = [
    /\b\d+\s*(год|года|лет)\s+(опыта|стажа)\b/i,
    /\b(опыт|стаж)\s+\d+\s*(год|года|лет)\b/i,
    /\b\d+[\s-]*(летний|годичн|годовалый)\s+(опыт|стаж)\b/i,
    /\b\d+\s+лет\s+в\s+разработке\b/i,
  ];
  for (const re of yearPatterns) {
    if (re.test(text)) {
      violations.push("неподтверждённый стаж/количество лет опыта");
      break;
    }
  }

  // Role label checks against confirmed profile
  if (!isProfileAllowed(profileType, "fullstack")) {
    for (const term of FULLSTACK_TERMS) {
      if (hasExactTerm(text, term)) {
        violations.push(`profile mismatch: "${term}" не подтверждён опытом`);
      }
    }
  }
  if (!isProfileAllowed(profileType, "backend")) {
    for (const term of BACKEND_TERMS) {
      if (hasExactTerm(text, term)) {
        violations.push(`profile mismatch: "${term}" не подтверждён опытом`);
      }
    }
  }
  if (!isProfileAllowed(profileType, "frontend")) {
    for (const term of FRONTEND_TERMS) {
      if (hasExactTerm(text, term)) {
        violations.push(`profile mismatch: "${term}" не подтверждён опытом`);
      }
    }
  }

  // Unknown profile: block role claims and action verbs
  if (profileType.primary === "unknown") {
    for (const term of UNKNOWN_PROFILE_BLOCKED) {
      if (hasExactTerm(text, term)) {
        violations.push(`unknown profile: "${term}" нельзя использовать без опыта`);
      }
    }
  }

  // Block excluded skills (not confirmed, not in active profile) — even as "знаком с X"
  for (const excluded of excludedForSummarySkills) {
    if (hasExactTerm(text, excluded)) {
      violations.push(`"${excluded}" в summary без подтверждения`);
    }
  }

  // Overclaim: "опыт работы с X" / "имею опыт с X" where X is unconfirmed
  const unconfirmedSet = new Set((unconfirmedSkills || []).map(normalizeAboutText));
  const experiencePatterns = ["опыт работы с ", "имею опыт работы с ", "имею опыт с ", "опыт с "];
  for (const pattern of experiencePatterns) {
    const idx = lower.indexOf(pattern);
    if (idx !== -1) {
      const after = lower.slice(idx + pattern.length);
      const wordMatch = after.match(/^[а-яa-z0-9\s,]+/);
      if (wordMatch) {
        const techPart = wordMatch[0].trim();
        for (const [unconfirmed] of unconfirmedSet) {
          if (techPart.includes(unconfirmed)) {
            violations.push(`overclaim: "опыт с ${unconfirmed}" без подтверждения`);
            break;
          }
        }
      }
    }
  }

  // Overclaim: "опыт работы с X" / "работал с X" where X is project-confirmed only (not experience)
  const projectSet = new Set((projectConfirmedSkills || []).map(normalizeAboutText));
  const workExperiencePatterns = ["опыт работы с ", "имею опыт работы с ", "работал с ", "профессионал", "коммерческий опыт с "];
  for (const pattern of workExperiencePatterns) {
    const idx = lower.indexOf(pattern);
    if (idx !== -1) {
      const after = lower.slice(idx + pattern.length);
      const wordMatch = after.match(/^[а-яa-z0-9\s,]+/);
      if (wordMatch) {
        const techPart = wordMatch[0].trim();
        for (const [projected] of projectSet) {
          if (techPart.includes(projected)) {
            violations.push(`project-overclaim: "${pattern}${projected}" — проектный опыт, не опыт работы`);
            break;
          }
        }
      }
    }
  }

  return { ok: violations.length === 0, violations };
}

/* ── Retry / Fallback ─────────────────────────────────────────────── */

function buildRetryPrompt(originalText, violations, excludedForSummarySkills, profileType) {
  const isUnknown = profileType.primary === "unknown";
  return `Исправь текст "О себе". Есть нарушения:

Текст:
${originalText}

Нарушения:
${violations.map((v) => `- ${v}`).join("\n")}

Технологии, которые НЕ нужно упоминать (не подтверждены опытом):
${excludedForSummarySkills.length > 0 ? excludedForSummarySkills.join(", ") : "Нет"}

Требования:
- Строго 2–3 предложения, 300–500 символов.
- Убери запрещённые фразы и неподтверждённые технологии.
- Не называй профиль по skills-only данным.
${isUnknown ? "- Experience пустой. НЕ используй: 'разработчик', 'опыт', 'создаю', 'разрабатываю'. Пиши только: 'имею навыки работы с X', 'знаком с X'." : ""}
- Skills-only технологии описывай только как навыки, не как опыт.
- Не используй слова: обладаю, продвинутый, уверенно, эффективно, полноценный, масштабируемый, надежный, эстетически, позволяет, помогает.
- Не используй мотивационные и self-development формулировки: продолжаю развиваться, стремлюсь, изучаю, углубляю знания, нацелен на, открыт к возможностям. Summary должен описывать уже имеющийся подтверждённый опыт и навыки.
- НЕ указывай количество лет опыта или стажа. Не пиши "N лет опыта", "N лет в разработке". Это галлюцинация — в приложении нет такого поля.
- Пиши технологии конкретно: "интерфейсы на React", не "высокоэффективные интерфейсы".
- Ответь ТОЛЬКО исправленным текстом, без объяснений.`;
}

function buildFallbackText(experienceText, profileType, skills) {
  const lower = normalizeAboutText(experienceText);
  const primary = profileType.primary;

  // Collect confirmed tech from experience
  const fe = [];
  const be = [];
  const tools = [];

  if (hasExactTerm(lower, "react")) fe.push("React");
  if (hasExactTerm(lower, "javascript")) fe.push("JavaScript");
  if (hasExactTerm(lower, "css")) fe.push("CSS");
  if (hasExactTerm(lower, "material ui") || hasExactTerm(lower, "mui")) fe.push("Material UI");
  if (hasExactTerm(lower, "html")) fe.push("HTML");
  if (hasExactTerm(lower, "vue")) fe.push("Vue");
  if (hasExactTerm(lower, "angular")) fe.push("Angular");

  if (hasExactTerm(lower, "java")) be.push("Java");
  if (hasExactTerm(lower, "spring") || hasExactTerm(lower, "spring boot")) be.push("Spring Boot");
  if (hasExactTerm(lower, "python")) be.push("Python");
  if (hasExactTerm(lower, "node.js") || hasExactTerm(lower, "nodejs")) be.push("Node.js");
  if (hasExactTerm(lower, "postgresql")) tools.push("PostgreSQL");
  if (hasExactTerm(lower, "mongodb")) tools.push("MongoDB");
  if (hasExactTerm(lower, "docker")) tools.push("Docker");

  if (primary === "fullstack") {
    const parts = [];
    if (fe.length) parts.push(`создание интерфейсов на ${fe.join(", ")}`);
    if (be.length) parts.push(`backend-задачи на ${be.join(", ")}`);
    const line1 = `Fullstack-разработчик${parts.length ? " с опытом " + parts.join(" и ") : ""}.`;
    const line2 = tools.length ? `Работал с ${tools.join(", ")}.` : "";
    return [line1, line2].filter(Boolean).join(" ");
  }

  if (primary === "frontend") {
    const tech = fe.length ? ` на ${fe.join(", ")}` : "";
    const line1 = `Frontend-разработчик с опытом создания пользовательских интерфейсов${tech}.`;
    const extras = [];
    if (hasExactTerm(lower, "api") || hasExactTerm(lower, "rest")) extras.push("интеграцией сторонних API");
    if (tools.length) extras.push(`работой с ${tools.join(", ")}`);
    const line2 = extras.length ? `Занимался ${extras.join(" и ")}.` : "";
    return [line1, line2].filter(Boolean).join(" ");
  }

  if (primary === "backend") {
    const tech = be.length ? ` на ${be.join(", ")}` : "";
    const line1 = `Backend-разработчик с опытом разработки серверной логики${tech}.`;
    const line2 = tools.length ? `Работал с ${tools.join(", ")}.` : "";
    return [line1, line2].filter(Boolean).join(" ");
  }

  if (primary === "qa") {
    return "QA-специалист с опытом тестирования веб-приложений и написания автотестов.";
  }

  if (primary === "devops") {
    const tech = tools.length ? ` (${tools.join(", ")})` : "";
    return `DevOps-инженер с опытом настройки CI/CD и инфраструктуры${tech}.`;
  }

  if (primary === "data") {
    return "Специалист по данным с опытом анализа и обработки информации.";
  }

  if (primary === "mobile") {
    return "Mobile-разработчик с опытом создания мобильных приложений.";
  }

  if (primary === "design") {
    return "UI/UX-дизайнер с опытом проектирования интерфейсов.";
  }

  // unknown: cautious, skills-only wording
  const skillNames = (skills || [])
    .map(getAboutSkillName)
    .filter(Boolean)
    .slice(0, 6);
  const skillList = skillNames.length > 0 ? skillNames.join(", ") : "указанными в резюме";
  return `IT-специалист с набором заявленных навыков в области веб-разработки. Имею навыки работы с ${skillList}.`;
}

/* ── Main function ────────────────────────────────────────────────── */

export async function generateAboutMe({ name, about, skills, experience, github, projects = [] }) {
  if (!isAIAvailable()) {
    throw new Error("AI-сервис недоступен");
  }

  const experienceText = getExperienceText(experience);
  const githubText = getGithubText(github);

  const manualProjects = Array.isArray(projects) ? projects : [];
  const projectsText = manualProjects
    .filter((p) => p.description || p.techStack)
    .map((p) => [p.name, p.role, p.description, p.techStack, p.period].filter(Boolean).join(" "))
    .join(" ");

  const profileType = detectProfileType(experienceText, githubText, skills);

  const excludedForSummarySkills = buildExcludedForSummarySkills(
    skills, experienceText, githubText, profileType
  );
  const excludedSet = new Set(excludedForSummarySkills.map(normalizeAboutText));

  const detailedSkills = buildDetailedSkillsForPrompt(
    skills, experienceText, githubText, excludedSet
  );

  const confirmedTech = buildConfirmedTechnologies(skills, experienceText, githubText, projectsText);
  const unconfirmedSkills = buildUnconfirmedSkills(skills, experienceText, githubText, projectsText);
  const { projectConfirmed: projectConfirmedSkills } = splitSkillConfirmation(skills, experienceText, githubText, projectsText);

  const expList = (experience || [])
    .map((e) => `${e.position || ""} в ${e.company || ""}: ${e.description || ""}`)
    .filter(Boolean)
    .join("\n");

  const ghList = (github || [])
    .map((g) => `${g.name || ""}: ${g.description || ""} (${g.stars || 0} stars)`)
    .filter(Boolean)
    .join("\n");

  const hasAbout = about && about.trim().length > 0;
  const profileLabel = getProfileLabel(profileType);
  const isUnknown = profileType.primary === "unknown";

  const prompt = `Ты — карьерный консультант. Напиши краткий раздел "О себе" для IT-специалиста.

${hasAbout ? `ТЕКУЩИЙ ТЕКСТ "О СЕБЕ" (улучши, сохранив смысл):\n${about}` : 'Текст "О себе" отсутствует — сгенерируй новый.'}

ИНФОРМАЦИЯ О КАНДИДАТЕ:
Имя: ${name || "Не указано"}
Профиль определён по подтверждённому опыту: ${profileLabel} (primary: ${profileType.primary}${profileType.secondary.length ? `, secondary: ${profileType.secondary.join(", ")}` : ""})
Confirmed scores (experience+github): ${Object.entries(profileType.confirmedScores).map(([k, v]) => `${k}=${v}`).join(", ")}

Технологии, подтверждённые опытом (можно писать "работал с X", "опыт с X):
${confirmedTech.length > 0 ? confirmedTech.join(", ") : "Нет"}

Технологии ТОЛЬКО из skills (НЕ считаются опытом, писать только как "имею навыки работы с X" или "знаком с X"):
${unconfirmedSkills.length > 0 ? unconfirmedSkills.join(", ") : "Нет"}

Заявленные навыки (НЕ путай с коммерческим опытом):
${detailedSkills || "Не указаны"}

Практический опыт работы (подтверждённый):
${expList || "Не указан"}

Проекты / GitHub:
${ghList || "Не указаны"}

Ручные проекты (проектный опыт, НЕ опыт работы):
${manualProjects.filter((p) => p.description || p.techStack).map((p) => `- ${p.name || "Проект"}: ${[p.role, p.description, p.techStack, p.period].filter(Boolean).join(" — ")}`).join("\n") || "Не указаны"}

Технологии, которые НЕ нужно упоминать в summary (не подтверждены опытом и не соответствуют профилю):
${excludedForSummarySkills.length > 0 ? excludedForSummarySkills.join(", ") : "Нет"}

${isUnknown ? "ОПЫТ РАБОТЫ НЕ УКАЗАН ИЛИ НЕДОСТАТОЧЕН. Нельзя писать 'опыт с X', 'разработчик X-профиля', 'создаю приложения', 'разрабатываю'. Можно писать только 'имею навыки работы с X' или 'знаком с X'." : ""}

ЖЁСТКИЕ ПРАВИЛА:
1. Профиль определён по подтверждённому опыту (experience/github), а не по skills. Skills — это только заявленные навыки.
2. Если experience пустой — НЕ пиши "разработчик", "опыт", "создаю", "разрабатываю". Пиши "имею навыки работы с X".
3. Включай максимум 5–7 ключевых технологий. Приоритет: технологии из experience.description → затем databases/tools если связаны с опытом. НЕ перечислять весь skills list.
4. Технологии ТОЛЬКО из skills (не в experience.description) — НЕ пиши "опыт с X", не делай их центральными.
5. НЕ пиши "практический опыт с X", если X есть только в навыках.
6. Используй ТОЛЬКО факты из резюме. НЕ выдумывай опыт, метрики, должности, seniority.
7. Формат: 2–3 предложения, сплошной текст (без списков, без markdown).
8. 300–500 символов. Не длиннее.
9. ЗАПРЕЩЕНО: "глубокие знания", "эксперт", "профессионал высокого уровня", "значительно", "высокоэффективный", "отзывчивый", "сильный", "уверенный", "экспертный", "профессиональный", "качественный", "стремлюсь", "ориентирован на", "мой подход", "готов развиваться", "высокие требования", "повышение стабильности", "оптимизация кода", "обладаю", "продвинут", "уверенно", "эффективно", "полноценн", "масштабируем", "надежн", "надёжн", "эстетически", "позволяет", "помогает", "ключевые технологии включают".
10. Пиши технологии конкретно: "интерфейсы на React", "работа с Material UI и CSS". Не абстрактно: "современные технологии".
11. Не делай пользователя более опытным, чем следует из experience.description.
12. Язык: русский.
13. Ответь ТОЛЬКО готовым текстом, без объяснений.
14. НЕ указывай количество лет опыта или стажа. Не пиши "N лет опыта", "N лет в разработке" и т.п. В этом приложении нет поля для ввода стажа, любые числа — галлюцинация.
15. Ручные проекты и GitHub-проекты — это проектный опыт, НЕ опыт работы. Технологии из projects/GitHub подтверждают навыки как "проектный опыт", но НЕ позволяют писать "опыт работы с X", "работал с X", "коммерческий опыт". Разрешено: "в проектах использовал X", "проектный опыт с X".
16. Если experience пустой, но есть projects/GitHub: можно писать "есть проектный опыт с X", "в проектах использовал X". НЕЛЬЗЯ писать "работал с X", "имею опыт работы с X", "разработчик".
17. Validation также считает проектно-подтверждённые технологии НЕ подтверждёнными опытом работы — формулировки "опыт работы с X" будут заблокированы для технологий, найденных только в проектах/GitHub.

ПРИМЕРЫ СТИЛЯ:
Плохо: "создание высокоэффективных и отзывчивых пользовательских интерфейсов"
Хорошо: "создание пользовательских интерфейсов на React"
Плохо: "что позволило значительно улучшить функциональность веб-приложений"
Хорошо: "занимался интеграцией сторонних API в веб-приложения"
Плохо: "обладаю продвинутыми знаниями React"
Хорошо: "имею навыки работы с React"`;

  // First attempt
  const response = await callPuterAI(prompt);
  let text = extractAIText(response).trim();

  // Validate
  let validation = validateGeneratedAboutMe(text, profileType, excludedForSummarySkills, unconfirmedSkills, projectConfirmedSkills);

  if (import.meta.env.DEV && !validation.ok) {
    console.warn("[AboutMe] First attempt violations:", validation.violations);
  }

  // Retry once if violations found (skip retry for unknown profile — go straight to fallback)
  if (!validation.ok && profileType.primary !== "unknown") {
    const retryPrompt = buildRetryPrompt(text, validation.violations, excludedForSummarySkills, profileType);
    const retryResponse = await callPuterAI(retryPrompt);
    const retryText = extractAIText(retryResponse).trim();

    const retryValidation = validateGeneratedAboutMe(retryText, profileType, excludedForSummarySkills, unconfirmedSkills, projectConfirmedSkills);

    if (import.meta.env.DEV && !retryValidation.ok) {
      console.warn("[AboutMe] Retry violations:", retryValidation.violations);
    }

    if (retryValidation.ok && retryText.length > 20) {
      text = retryText;
    } else {
      text = buildFallbackText(experienceText, profileType, skills);
    }
  } else if (!validation.ok) {
    text = buildFallbackText(experienceText, profileType, skills);
  }

  // Final length cap: keep first 2–3 sentences
  const finalSentences = splitSentences(text).slice(0, 3);
  return finalSentences.join(" ");
}

export async function improveExperienceDescription({ description, position, company }) {
  if (!isAIAvailable()) {
    throw new Error("AI-сервис недоступен");
  }

  const prompt = `Ты — эксперт по составлению резюме. Переформулируй описание опыта работы более профессионально.

Должность: ${position || "Не указана"}
Компания: ${company || "Не указана"}

Исходное описание:
${description}

ЖЁСТКИЕ ПРАВИЛА:
1. ТОЛЬКО переформулируй исходные факты. НИЧЕГО нового не добавляй.
2. ЗАПРЕЩЕНО выдумывать: обязанности, достижения, задачи, процессы, которых нет в исходнике.
3. ЗАПРЕЩЕНО добавлять: code review, mentoring, team leadership, наставничество, проведение собеседований, внедрение процессов, если об этом нет в исходном тексте.
4. ЗАПРЕЩЕНО добавлять оценки качества (стабильность, производительность, отзывчивость, масштабируемость), если их нет в исходнике.
5. Количество пунктов = количество фактов в исходнике. Если 3 факта — 3 пункта, не 4–5.
6. Раскрывай сокращения: TS → TypeScript, WS → WebSocket, CRM → CRM (если аббревиатура, оставляй), FE → Frontend.
7. Используй глаголы действия (разработал, внедрил, оптимизировал).
8. Если данных мало — сделай аккуратную формулировку без расширения.

Формат: каждый пункт с тире (- ) на новой строке.
Язык: русский.
Ответь ТОЛЬКО улучшенным текстом, без объяснений и вступлений.`;

  const response = await callPuterAI(prompt);

  return extractAIText(response).trim();
}

export async function generateCoverLetter({ jdText, name, about, skills, experience, found, missing, companyName, positionName, confirmedExperience, confirmedProjects, declaredOnly, missingEvidence, evidenceScore, technicalScore, overallScore }) {
  if (!isAIAvailable()) {
    throw new Error("AI-сервис недоступен");
  }

  const expDescriptions = experience
    .map((e) => `${e.position || ""} в ${e.company || ""}: ${e.description || ""}`)
    .filter(Boolean)
    .join("\n");

  const detailedSkills = (skills || [])
    .map((s) => {
      if (typeof s === "string") return `- ${s}`;
      const n = s.name || s.skill_name || "";
      if (!n) return "";
      const level = Number(s.level) || 0;
      let levelDesc = "";
      if (level >= 1 && level <= 2) levelDesc = " (базовый уровень / знакомство)";
      else if (level === 3) levelDesc = " (средний уровень)";
      else if (level >= 4) levelDesc = " (продвинутый уровень)";
      return `- ${n}${levelDesc}`;
    })
    .filter(Boolean)
    .join("\n");

  const hasCompany = companyName && companyName.trim().length > 0;
  const hasPosition = positionName && positionName.trim().length > 0;

  const prompt = `Ты — карьерный консультант. Напиши сопроводительное письмо (cover letter) к вакансии.

ВАЖНО: Существует принципиальная разница между источниками информации о кандидате:
- НАВЫКИ — то, что кандидат заявляет в списке навыков (обучение, знакомство, теория). Это НЕ подтверждённый практический опыт.
- ОПЫТ — то, что описан в конкретных местах работы (experience). Это подтверждённый практический опыт с задачами и результатами.
- ПРОЕКТЫ — ручные проекты и/или GitHub-репозитории. Это проектное подтверждение навыков, НЕ опыт работы и НЕ коммерческий опыт.

ИНФОРМАЦИЯ О КАНДИДАТЕ:
Имя: ${name || "Не указано"}
О себе: ${about || "Не указано"}

Заявленные навыки (УРОВЕНЬ ВАЖЕН — не путай с коммерческим опытом):
${detailedSkills || "Не указаны"}

Практический опыт работы (описание задач и результатов):
${expDescriptions || "Не указан"}

ВАКАНСИЯ (только требования, задачи и стек — игнорируй льготы, условия, описание офиса, корпоративные бонусы, график, дресс-код, соцпакет, аккредитацию, ипотеку):
${jdText}

${hasCompany ? `НАЗВАНИЕ КОМПАНИИ: ${companyName}` : "НАЗВАНИЕ КОМПАНИИ: неизвестно"}
${hasPosition ? `ДОЛЖНОСТЬ: ${positionName}` : "ДОЛЖНОСТЬ: не указана"}

СОВПАДАЮЩИЕ НАВЫКИ КАНДИДАТА С ВАКАНСИЕЙ: ${found?.join(", ") || "Нет"}
ОТСУТСТВУЮЩИЕ НАВЫКИ: ${missing?.join(", ") || "Нет"}

EVIDENCE-BASED КЛАССИФИКАЦИЯ (если предоставлена):
- Подтверждено опытом (МОЖНО писать "опыт работы с X", "в компании X"): ${confirmedExperience?.join(", ") || "Нет"}
- Подтверждено проектами/GitHub (МОЖНО писать "в проекте X использовал", "проектный опыт с X", НЕ писать "опыт работы с X", "коммерческий опыт"): ${confirmedProjects?.join(", ") || "Нет"}
- Есть только в навыках (ПИСАТЬ как "имею навыки работы с X", НЕ как опыт): ${declaredOnly?.join(", ") || "Нет"}
- Отсутствует в резюме (НЕ упоминать как опыт, НЕ выдумывать): ${missingEvidence?.join(", ") || "Нет"}

ОЦЕНКИ СООТВЕТСТВИЯ:
- Evidence Score: ${evidenceScore ?? "неизвестен"}%
- Technical Score: ${technicalScore ?? "неизвестно"}%
- Overall Score: ${overallScore ?? "неизвестно"}%

ЖЁСТКИЕ ПРАВИЛА:
1. Используй ТОЛЬКО факты из резюме. НЕ выдумывай опыт, проекты, достижения, метрики, должности.
2. Если название компании неизвестно — начни с "Здравствуйте!" или "Добрый день!". НЕ пиши "[Название компании]" и не выдумывай название.
3. Если должность не указана — используй "ваша вакансия", "открытую позицию", НЕ пиши конкретную должность.
4. Разделяй источники информации:
   - Технология есть ТОЛЬКО в навыках (не упомянута в experience) → пиши "имею навыки работы с X", "знаком с X", "имею базовое понимание X" в зависимости от уровня.
   - Технология есть в experience.description → можно писать "опыт работы с X".
   - Технология есть в confirmedProjects (проекты/GitHub) → пиши "в проекте X использовал", "проектный опыт с X". НЕ пиши "опыт работы с X" или "коммерческий опыт" для технологии из проектов, если её нет в experience.
   - Уровень навыка 1-2: "знаком с основами X", "имею базовое понимание X".
   - Уровень навыка 3: "имею навыки работы с X".
   - Уровень навыка 4-5: можно "уверенно работаю с X", но "практический опыт" — только если технология есть в experience.description.
5. НИКОГДА не пиши "мой опыт с X", если X есть только в навыках, но не встречается в описании опыта работы. Это оверклейм.
6. Отсутствующие навыки (missing) — НЕ пиши "у меня нет опыта с..." и не утверждай отсутствие. Можно использовать как мягкую зону роста или не упоминать вообще.
7. НЕ выдумывай коммерческий опыт, backend-опыт, опыт с технологиями из missing.
8. Письмо 3-4 абзаца, без нумерации. Без пафоса и воды.
9. Структура: приветствие → почему интересна вакансия → ключевые компетенции → подпись.
10. Не используй шаблонные фразы вроде "в связи с вашим вакантным местом", "на территории компании", "в рамках".
11. ЗАПРЕЩЕНО использовать: "с вашей поддержкой", "внести значительный вклад", "я идеально подхожу", "полностью соответствую", "внести ощутимый вклад", "стать ценным участником", "стать частью команды", "внести интересные идеи и решения", "увлекательные вызовы", "достигать новых высот".
12. Если совпадение слабое (evidenceScore < 40, confirmedExperience и confirmedProjects пусты) — пиши максимально осторожно: "навыки могут быть релевантны для смежных задач". ЗАПРЕЩЕНО: "мой опыт", "проектный опыт", "опыт работы", "портфолио подтверждает". НЕ утверждай наличие опыта/проектов, если evidence пустой.
13. Если confirmedProjects пустой — ЗАПРЕЩЕНО использовать фразы: "проектный опыт", "в проектах", "проектная часть", "портфолио подтверждает", "мой проектный опыт может быть полезен". Пиши ТОЛЬКО про confirmedExperience или declaredOnly.
14. Если confirmedExperience пустой — ЗАПРЕЩЕНО использовать фразы: "опыт работы с X", "опыт проектирования", "мой опыт", "профессиональный опыт", "коммерческий опыт", "уверенно разрабатываю", "продвинутые знания". Разрешено: "в проектах использовал X" ТОЛЬКО если X в confirmedProjects; "указан навык X" если X в declaredOnly.
15. declaredOnly — ЗАПРЕЩЕНО: "подтверждено", "применял", "использовал в проектах", "опыт работы". Разрешено: "указан навык", "имею навыки", "знаком с X".
16. Если профиль кандидата — frontend/web UI, а вакансия — backend/fullstack/highload: НЕ пиши, что стремишься развиваться именно в highload/backend-системах. Позиционируй через свои сильные стороны: "развиваться в разработке интерфейсов и интеграции клиентской части с серверными сервисами".
17. Акцент на конкретном пересечении резюме и вакансии — какие задачи из вакансии кандидат может решать.
18. MissingEvidence — НЕ позиционировать как "область роста" или "план обучения". Это технологии, которых нет в резюме. Их НЕЛЬЗЯ упоминать в позитивном контексте. Формулировка: "часть требований в резюме не подтверждена" или "позиция может быть смежной".
19. ${name ? `Письмо ОБЯЗАТЕЛЬНО заканчивай подписью:\nС уважением,\n${name}` : "Подпись не нужна (имя не указано)."}
20. Язык: русский.
21. Ответь ТОЛЬКО текстом письма, без объяснений и вступлений.`;

  const coverLetterMode = getCoverLetterMode({
    evidenceScore,
    technicalScore,
    confirmedExperience,
    confirmedProjects,
    declaredOnly,
    missingEvidence,
  });

  if (coverLetterMode.mode === "careful") {
    return buildWeakMatchCoverLetter({
      name,
      confirmedExperience,
      confirmedProjects,
      declaredOnly,
      companyName,
      positionName,
    });
  }

  const response = await callPuterAI(prompt);
  const text = extractAIText(response).trim();

  const validation = validateCoverLetterText(text, {
    positionName,
    confirmedExperience,
    confirmedProjects,
    declaredOnly,
    missingEvidence,
    mode: coverLetterMode.mode,
  });

  if (!validation.ok) {
    if (import.meta.env.DEV) {
      console.warn("[CoverLetter] Unsafe AI output, using safe fallback:", validation.violations);
    }
    return buildSafeCoverLetterFallback({
      name,
      positionName,
      confirmedExperience,
      confirmedProjects,
      declaredOnly,
    });
  }

  return text;
}

export async function generateJobMatchAdvice({
  jdText,
  confirmedExperience = [],
  confirmedProjects = [],
  declaredOnly = [],
  missingEvidence = [],
  evidenceScore,
  technicalScore,
  overallScore,
}) {
  if (!isAIAvailable()) {
    throw new Error("AI-сервис недоступен");
  }

  const prompt = `Ты — карьерный консультант и reviewer резюме. Составь список рекомендаций по улучшению резюме под конкретную вакансию.

ВАЖНО: Ты НЕ должен автоматически менять резюме. Ты НЕ должен добавлять навыки в резюме. Ты НЕ должен выдавать неподтверждённый опыт за подтверждённый. Работай как карьерный помощник: объясни, что можно улучшить, но без выдумывания опыта.

ВАКАНСИЯ:
${jdText}

EVIDENCE-BASED КЛАССИФИКАЦИЯ:
- Подтверждено опытом (confirmedExperience — МОЖНО писать "опыт работы с X"): ${confirmedExperience?.join(", ") || "Нет"}
- Подтверждено проектами/GitHub (confirmedProjects — только проектное подтверждение): ${confirmedProjects?.join(", ") || "Нет"}
- Есть только в навыках (declaredOnly — ТОЛЬКО как заявленный навык, НЕ как опыт): ${declaredOnly?.join(", ") || "Нет"}
- Отсутствует в резюме (missingEvidence — НЕ упоминать как опыт, НЕ советовать добавлять без реального опыта): ${missingEvidence?.join(", ") || "Нет"}

ОБЩИЕ ОЦЕНКИ:
- Evidence Score: ${evidenceScore ?? "неизвестен"}%
- Техническое совпадение: ${technicalScore ?? "неизвестно"}%
- Общее совпадение: ${overallScore ?? "неизвестно"}%

ЖЁСТКИЕ ПРАВИЛА:
1. confirmedExperience — подтверждённый опыт. Можно рекомендовать усилить описание: добавить конкретику, задачи, контекст, результат. НЕ выдумывай метрики, если их нет.
2. confirmedProjects — проектное подтверждение (ручные проекты и/или GitHub-репозитории). Можно рекомендовать сильнее показать проект, подробнее описать роль/стек, перенести выше. НЕ пиши, что это коммерческий опыт. НЕ пиши "опыт работы" для проектного контекста.
3. declaredOnly — навык указан только в skills. Писать ТОЛЬКО как "навык указан в навыках". Рекомендовать подтвердить его в опыте или проекте ТОЛЬКО при наличии реального опыта. НЕ пиши "у вас есть опыт с X".
4. missingEvidence — технология не найдена в резюме. НЕ советуй просто добавить её. Формулировка: "добавляйте только при наличии реального опыта".
5. Если evidenceScore < 40% — добавь предупреждение, что вакансия слабо подтверждается резюме, и рекомендуй не адаптировать резюме искусственно. НЕ используй уверенные формулировки типа "проектный опыт". Если confirmedProjects пустой — не пиши "проектный опыт". Используй "слабо подтверждено", "не адаптируйте искусственно".
6. Если evidenceScore >= 70% — предложи усилить уже подтверждённые совпадения. НЕ переписывай всё резюме.
7. НЕ выдумывай: метрики, компании, обязанности, seniority, коммерческий опыт, годы опыта.
8. НЕ советуй добавлять отсутствующие технологии без реального опыта.
9. Рекомендации должны быть actionable, но безопасные.
10. ЗАПРЕЩЕНО: "обязательно добавьте", "смело укажите", "у вас есть опыт с X" для declaredOnly/missingEvidence.
11. НЕ давай общие рекомендации про форматирование, грамматику, стиль, оформление, структуру документа, если они напрямую не связаны с результатами анализа вакансии.
12. Каждая рекомендация должна опираться на одно из evidence-полей: confirmedExperience, confirmedProjects, declaredOnly, missingEvidence, evidenceScore. НЕ добавляй generic career advice.
13. ЗАПРЕЩЕНО писать рекомендации вроде "проверьте грамматику", "улучшите оформление", "сделайте резюме читабельнее", "обратите внимание на форматирование", если в анализе вакансии нет данных, которые требуют такой рекомендации.
14. Если не хватает данных для 4–7 хороших рекомендаций — лучше дать 3–5 конкретных evidence-based рекомендаций, чем добивать список общими советами.
15. Тип [general] использовать ТОЛЬКО для рекомендаций, связанных с evidenceScore или общим уровнем совпадения, например: "Evidence Score низкий — вакансия слабо подтверждается резюме, не адаптируйте резюме искусственно." НЕЛЬЗЯ использовать [general] для абстрактных советов про грамматику/оформление.
16. ОБЯЗАТЕЛЬНЫЕ БЛОКИ РЕКОМЕНДАЦИЙ:
   - Если confirmedExperience не пустой — добавь минимум 1 рекомендацию [confirmed_experience].
   - Если confirmedProjects не пустой — добавь минимум 1 рекомендацию [confirmed_project].
   - Если declaredOnly не пустой — добавь минимум 1 рекомендацию [declared_skill].
   - Если missingEvidence не пустой — добавь минимум 1 рекомендацию [missing].
   - [general] используй только дополнительно, а не вместо конкретных блоков.
17. ОБЯЗАТЕЛЬНЫЕ ФОРМУЛИРОВКИ ДЛЯ КАЖДОГО ТИПА:
   - [confirmed_experience]: "X подтверждён в опыте. Можно расширить описание: указать задачи, контекст и результат, если эти данные действительно есть."
     Для нескольких: "X, Y подтверждены в опыте. Можно расширить описание: указать задачи, контекст и результат, если эти данные действительно есть."
     Не писать "результаты, которые вы достигли". Не выдумывать результаты.
   - [confirmed_project]: "X подтверждён в проектах/GitHub. Можно подробнее описать роль и стек, если это соответствует реальности."
     Для нескольких: "X, Y подтверждены в проектах/GitHub. Можно подробнее описать роль и стек, если это соответствует реальности."
   - [declared_skill]: "X указан только в навыках. При наличии реального опыта можно отразить его в описании опыта или проекта."
     Для нескольких: "X, Y указаны только в навыках. При наличии реального опыта можно отразить их в описании опыта или проекта."
   - [missing]: "X не найден в резюме. Добавляйте этот навык только при наличии реального опыта."
     Для нескольких: "X, Y не найдены в резюме. Добавляйте эти навыки только при наличии реального опыта."
   - [general]: ТОЛЬКО для связи с evidenceScore, например: "Evidence Score низкий — вакансия слабо подтверждается резюме, не адаптируйте резюме искусственно."

18. ЗАПРЕЩЁННЫЕ ФРАЗЫ И ОБРАЩЕНИЯ:
   - ЗАПРЕЩЕНО: "рассмотривайте", "рекомендую", "советую", "подумайте о том", "подтвердить его деталями", "которые вы достигли", "стоит рассмотреть", "рекомендуется рассмотреть", "стоит подумать".
   - ЗАПРЕЩЕНО обращение от первого лица: "рекомендую", "советую", "предлагаю". Письмо от третьего лица или нейтральное.
   - ЗАПРЕЩЕНО канцелярит и кривые формы: "рассмотривайте возможность", "подтвердить его в разделе", "отразить его в описании".
   - Используй нейтральные формулировки: "можно", "стоит", "при наличии реального опыта".

19. ОБЩИЙ СТИЛЬ:
   - Письмо на "вы", без обращения от первого лица.
   - Не ставь запятую после "при наличии реального опыта" перед основным предложением.
   - Не добавляй общие советы про грамматику, оформление, форматирование, структуру документа.
   - Не используй��у "подумайте о том, чтобы", "рассмотрите возможность", "стоит обратить внимание".
   - Каждая рекомендация — одна конкретная мысль, одно предложение.

ФОРМАТ РЕЗУЛЬТАТА:
- Язык: русский
- 4–7 коротких рекомендаций
- Нумерованный список
- Профессионально, без пафоса
- Без markdown-таблиц
- Каждая рекомендация должна начинаться с типа в квадратных скобках:
  [confirmed_experience] — усиление подтверждённого опыта
  [confirmed_project] — усиление проектного подтверждения
  [declared_skill] — заявленный навык
  [missing] — отсутствующий навык
  [general] — общая рекомендация
- Ответь ТОЛЬКО списком рекомендаций, без объяснений и вступлений.`;

  const response = await callPuterAI(prompt);
  const text = extractAIText(response).trim();

  const validation = validateJobMatchAdviceText(text, {
    confirmedExperience,
    confirmedProjects,
    declaredOnly,
    missingEvidence,
  });

  if (!validation.ok) {
    if (import.meta.env.DEV) {
      console.warn("[JobMatchAdvice] Unsafe AI output:", validation.violations);
    }
    return buildJobMatchAdviceFallback({
      confirmedExperience,
      confirmedProjects,
      declaredOnly,
      missingEvidence,
      evidenceScore,
    });
  }

  return text;
}
