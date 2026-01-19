import {
  normalizeResumeData,
  hasNumbers,
  wordCount,
  safeText,
} from "./helpers";

// Небольшие утилиты именно для рекомендаций
const containsActionVerb = (text) => {
  const t = safeText(text).toLowerCase();
  if (!t) return false;
  // базовый набор "глаголов действия" (RU + EN)
  const verbs = [
    "разработ", "реализ", "внедр", "оптимиз", "улучш", "автоматиз", "интегр",
    "поддерж", "настро", "спроект", "тестир", "рефактор",
    "develop", "implement", "optimiz", "improv", "automat", "integrat",
    "build", "design", "test", "refactor", "deploy",
  ];
  return verbs.some((v) => t.includes(v));
};

const looksLikeRange = (text) => {
  const t = safeText(text);
  if (!t) return false;
  // 2024-2025 / 2024–2025 / 01.2024-12.2025 / 2024 - now и т.п.
  return /(\d{4}|\d{2}\.\d{4}).*[-–—].*(\d{4}|настоя|now|present)/i.test(t);
};

const isEmailValid = (email) => {
  const e = safeText(email);
  if (!e) return false;
  // простая проверка для UI/совета (не строгая RFC)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
};

const isPhoneProbablyValid = (phone) => {
  const p = safeText(phone);
  if (!p) return false;
  // минимально: хотя бы 10 цифр
  const digits = p.replace(/\D/g, "");
  return digits.length >= 10;
};

const uniqueByText = (arr) => {
  const seen = new Set();
  return arr.filter((x) => {
    const key = x?.text || "";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function getRecommendations(resumeData) {
  const data = normalizeResumeData(resumeData);
  const { profile, skills, experience, education, github } = data;

  const rec = [];

  // -----------------------
  // PROFILE / CONTACTS
  // -----------------------
  if (!safeText(profile.name)) {
    rec.push({
      type: "profile",
      target: "profile-name",
      text: "Добавьте ФИО — это первое, что видит HR.",
    });
  }

  if (!safeText(profile.email)) {
    rec.push({
      type: "profile",
      target: "profile-email",
      text: "Добавьте email для связи.",
    });
  } else if (!isEmailValid(profile.email)) {
    rec.push({
      type: "profile",
      target: "profile-email",
      text: "Проверьте email — похоже, в адресе есть ошибка формата.",
    });
  }

  if (!safeText(profile.phone)) {
    rec.push({
      type: "profile",
      target: "profile-phone",
      text: "Добавьте номер телефона (часто это ускоряет коммуникацию с рекрутером).",
    });
  } else if (!isPhoneProbablyValid(profile.phone)) {
    rec.push({
      type: "profile",
      target: "profile-phone",
      text: "Проверьте номер телефона — кажется, слишком мало цифр.",
    });
  }

  const aboutWC = wordCount(profile.about);
  if (!safeText(profile.about) || aboutWC < 12) {
    rec.push({
      type: "content",
      target: "profile-about",
      text: "Раздел «О себе» слишком короткий. Укажите специализацию, ключевой стек и роль (например: Frontend/Backend/QA).",
    });
  } else if (aboutWC > 80) {
    rec.push({
      type: "content",
      target: "profile-about",
      text: "Раздел «О себе» слишком длинный. Сократите до 3–5 предложений: кто вы, стек, сильные стороны, чего ищете.",
    });
  }

  // -----------------------
  // SKILLS
  // -----------------------
  if (skills.length < 5) {
    rec.push({
      type: "skills",
      target: "skills-skill",
      text: "Навыков меньше 5 — добавьте ключевые технологии (языки, фреймворки, инструменты).",
    });
  }

  // Дубликаты по имени (JavaScript/ javascript)
  const skillNames = skills
    .map((s) => safeText(typeof s === "string" ? s : s?.name).toLowerCase())
    .filter(Boolean);

  const dupSkillSet = new Set();
  const seenSkillSet = new Set();
  for (const n of skillNames) {
    if (seenSkillSet.has(n)) dupSkillSet.add(n);
    seenSkillSet.add(n);
  }
  if (dupSkillSet.size > 0) {
    rec.push({
      type: "skills",
      target: "skills-skill",
      text: "Есть повторяющиеся навыки. Уберите дубликаты, чтобы резюме выглядело аккуратно.",
    });
  }

  const lowLevelCount = skills.filter((s) => (s?.level != null ? Number(s.level) <= 2 : false)).length;
  if (lowLevelCount >= 3) {
    rec.push({
      type: "skills",
      target: "skills-level",
      text: "Много навыков с уровнем 1–2. Оставьте ключевые технологии и подчеркните сильные стороны (уровень 3–5).",
    });
  }

  const highLevelCount = skills.filter((s) => (s?.level != null ? Number(s.level) >= 4 : false)).length;
  if (skills.length >= 5 && highLevelCount === 0) {
    rec.push({
      type: "skills",
      target: "skills-level",
      text: "У вас нет навыков уровня 4–5. Отметьте 2–3 сильные технологии — это помогает рекрутеру быстрее понять ваш профиль.",
    });
  }

  // -----------------------
  // EXPERIENCE
  // -----------------------
  if (!experience.length) {
    rec.push({
      type: "experience",
      target: "experience-company",
      text: "Добавьте опыт/проекты. Для IT подойдут даже учебные и пет-проекты.",
    });
  } else {
    const withoutDesc = experience.filter((e) => !safeText(e.description)).length;
    if (withoutDesc > 0) {
      rec.push({
        type: "experience",
        target: "experience-description",
        text: "В опыте есть записи без описания. Добавьте: задачи, стек, результат.",
      });
    }

    const veryShortDesc = experience.filter((e) => safeText(e.description) && wordCount(e.description) < 5).length;
    if (veryShortDesc > 0) {
      rec.push({
        type: "experience",
        target: "experience-description",
        text: "Некоторые описания опыта слишком короткие. Добавьте 1–3 пункта: что делали, какие технологии, какой эффект.",
      });
    }

    const withoutAction = experience.filter((e) => safeText(e.description) && !containsActionVerb(e.description)).length;
    if (withoutAction > 0) {
      rec.push({
        type: "experience",
        target: "experience-description",
        text: "В описании опыта используйте глаголы действия: «разработал», «внедрил», «оптимизировал», «интегрировал».",
      });
    }

    const withoutMetrics = experience.filter((e) => safeText(e.description) && !hasNumbers(e.description)).length;
    if (withoutMetrics >= 1) {
      rec.push({
        type: "experience",
        target: "experience-description",
        text: "Добавьте метрики/цифры (%, время, количество пользователей, скорость, SLA). Это сильно усиливает резюме.",
      });
    }

    const withoutPeriod = experience.filter((e) => !safeText(e.period) && !safeText(e.startDate)).length;
    if (withoutPeriod > 0) {
      rec.push({
        type: "experience",
        target: "experience-period",
        text: "Укажите период работы/проекта (например, 2023–2024).",
      });
    } else {
      const weirdPeriod = experience.filter((e) => safeText(e.period) && !looksLikeRange(e.period)).length;
      if (weirdPeriod > 0) {
        rec.push({
          type: "experience",
          target: "experience-period",
          text: "Проверьте формат периода (например: 2024–2025 или 01.2024–12.2025).",
        });
      }
    }

    // одинаковая компания/позиция (дубликаты)
    const expKeys = experience
      .map((e) => `${safeText(e.company).toLowerCase()}|${safeText(e.position).toLowerCase()}`)
      .filter((k) => k !== "|");
    const expSeen = new Set();
    const expDup = expKeys.some((k) => (expSeen.has(k) ? true : (expSeen.add(k), false)));
    if (expDup) {
      rec.push({
        type: "experience",
        target: "experience-company",
        text: "Есть повторяющиеся записи опыта (одинаковая компания/позиция). Проверьте, не продублировали ли вы запись.",
      });
    }
  }

  // -----------------------
  // EDUCATION
  // -----------------------
  if (!education.length) {
    rec.push({
      type: "education",
      target: "education-institution",
      text: "Добавьте образование/курсы (вуз, онлайн-курсы, сертификаты).",
    });
  } else {
    const withoutYears = education.filter((e) => !safeText(e.years) && !safeText(e.year)).length;
    if (withoutYears > 0) {
      rec.push({
        type: "education",
        target: "education-years",
        text: "В образовании укажите годы обучения (например, 2022–2026) — это стандарт для резюме.",
      });
    }
  }

  // -----------------------
  // GITHUB / PROJECTS
  // -----------------------
  if (!github.length) {
    rec.push({
      type: "github",
      target: "github-username",
      text: "Подключите GitHub и добавьте 2–5 репозиториев. Для IT это сильный плюс.",
    });
  } else {
    if (github.length > 5) {
      rec.push({
        type: "github",
        target: "github-username",
        text: "Репозиториев больше 5 — оставьте 3–5 самых релевантных (с хорошим описанием и звёздами).",
      });
    }

    const emptyDesc = github.filter((r) => !safeText(r.description)).length;
    if (emptyDesc > 0) {
      rec.push({
        type: "github",
        target: "github-username",
        text: "Некоторые репозитории без описания. Добавьте: что делает проект + технологии.",
      });
    }

    const noUrl = github.filter((r) => !safeText(r.url)).length;
    if (noUrl > 0) {
      rec.push({
        type: "github",
        target: "github-username",
        text: "Проверьте ссылки на репозитории — у некоторых проектов нет URL.",
      });
    }

    const lowStars = github.filter((r) => (Number(r.stars || 0) === 0)).length;
    if (github.length >= 2 && lowStars === github.length) {
      rec.push({
        type: "github",
        target: "github-username",
        text: "Если звёзд нет — это ок. Но обязательно добавьте понятные описания и README в ключевых проектах.",
      });
    }
  }

  // -----------------------
  // Финальная чистка + ограничение
  // -----------------------
  const cleaned = uniqueByText(rec);

  // приоритет: profile/content/experience → skills → education → github
  const priority = { profile: 1, content: 2, experience: 3, skills: 4, education: 5, github: 6 };
  cleaned.sort((a, b) => (priority[a.type] || 99) - (priority[b.type] || 99));

  return cleaned.slice(0, 10);
}
