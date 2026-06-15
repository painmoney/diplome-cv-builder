import { normalizeResumeData, safeText, wordCount, getSkillName } from "./helpers";

const TEMPLATE_META = {
  minimalist: {
    atsLevel: "low_risk",
    label: "Минималистичный",
    recommendedFor: ["ATS-порталы", "конкурсы", "отклик через формы"],
    description: "Простой одноколоночный шаблон. Наименьший риск проблем при парсинге ATS.",
  },
  academic: {
    atsLevel: "medium_risk",
    label: "Академический",
    recommendedFor: ["стажировки", "учебные программы", "практика"],
    description: "Двухколоночный шаблон. Может хуже парситься некоторыми ATS из-за сложной структуры.",
  },
  github: {
    atsLevel: "portfolio",
    label: "GitHub-стиль",
    recommendedFor: ["портфолио", "прямая отправка рекрутеру", "демонстрация проектов"],
    description: "Тёмная тема в стиле GitHub. Лучше для просмотра человеком, чем для ATS.",
  },
};

function check(severity, status, id, title, description) {
  return { id, status, severity, title, description };
}

function formatCount(value, forms) {
  const abs = Math.abs(value) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${value} ${forms[2]}`;
  if (last > 1 && last < 5) return `${value} ${forms[1]}`;
  if (last === 1) return `${value} ${forms[0]}`;
  return `${value} ${forms[2]}`;
}

const formatWords = (c) => formatCount(c, ["слово", "слова", "слов"]);
const formatEntries = (c) => formatCount(c, ["запись", "записи", "записей"]);
const formatProjects = (c) => formatCount(c, ["проект", "проекта", "проектов"]);
const formatSkills = (c) => formatCount(c, ["навык", "навыка", "навыков"]);

function checkCompleteness(data) {
  const { profile, skills, experience, education, github } = data;
  const checks = [];

  checks.push(
    safeText(profile.name)
      ? check("success", "passed", "completeness_name", "ФИО заполнено", "Контактные данные доступны для рекрутера.")
      : check("error", "error", "completeness_name", "ФИО не заполнено", "Добавьте имя и фамилию — это обязательное поле для резюме.")
  );

  const email = safeText(profile.email);
  const hasEmail = !!email;
  const emailValid = hasEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  checks.push(
    !hasEmail
      ? check("error", "error", "completeness_email", "Email не заполнен", "Добавьте email для связи с рекрутером.")
      : !emailValid
        ? check("warning", "warning", "completeness_email", "Email выглядит некорректно", "Проверьте формат email-адреса.")
        : check("success", "passed", "completeness_email", "Email заполнен", "Контактный email указан.")
  );

  const phone = safeText(profile.phone);
  checks.push(
    phone
      ? check("success", "passed", "completeness_phone", "Телефон заполнен", "Номер телефона указан.")
      : check("error", "error", "completeness_phone", "Телефон не заполнен", "Добавьте номер телефона для связи.")
  );

  const aboutWords = wordCount(profile.about);
  checks.push(
    aboutWords >= 12
      ? check("success", "passed", "completeness_about", "О себе заполнено", `Раздел "О себе" содержит ${formatWords(aboutWords)}.`)
      : aboutWords > 0
        ? check("warning", "warning", "completeness_about", "О себе слишком короткое", `Сейчас ${formatWords(aboutWords)}. Рекомендуется 12+ слов.`)
        : check("warning", "warning", "completeness_about", "О себе не заполнено", "Добавьте краткое описание профессионального профиля.")
  );

  checks.push(
    skills.length >= 5
      ? check("success", "passed", "completeness_skills", "Навыки заполнены", `Указано ${formatSkills(skills.length)}.`)
      : skills.length > 0
        ? check("warning", "warning", "completeness_skills", "Мало навыков", `Указано ${formatSkills(skills.length)}. Рекомендуется 5+.`)
        : check("error", "error", "completeness_skills", "Навыки не заполнены", "Добавьте хотя бы 5 ключевых технологий.")
  );

  checks.push(
    experience.length > 0
      ? check("success", "passed", "completeness_experience", "Опыт работы добавлен", `${formatEntries(experience.length)} в опыте работы.`)
      : check("warning", "warning", "completeness_experience", "Опыт работы не добавлен", "Добавьте хотя бы одну запись опыта работы или проект.")
  );

  checks.push(
    education.length > 0
      ? check("success", "passed", "completeness_education", "Образование добавлено", `${formatEntries(education.length)} в образовании.`)
      : check("info", "info", "completeness_education", "Образование не добавлено", "Добавьте информацию об образовании, если она есть.")
  );

  checks.push(
    github.length > 0
      ? check("success", "passed", "completeness_github", "GitHub проекты добавлены", `${formatProjects(github.length)} в резюме.`)
      : check("info", "info", "completeness_github", "GitHub проекты не добавлены", "Подключите GitHub и добавьте релевантные проекты.")
  );

  const passed = checks.filter((c) => c.status === "passed").length;
  const score = Math.round((passed / checks.length) * 100);

  return { score, checks };
}

function checkContentQuality(data) {
  const { profile, skills, experience } = data;
  const checks = [];

  const aboutWords = wordCount(profile.about);
  if (aboutWords === 0) {
    checks.push(check("info", "info", "quality_about_length", "Длина раздела «О себе» не проверялась", "Сначала заполните раздел «О себе»."));
  } else if (aboutWords < 12) {
    checks.push(check("warning", "warning", "quality_about_length", "О себе слишком короткое", `Сейчас ${formatWords(aboutWords)}. Рекомендуется 12+ слов.`));
  } else if (aboutWords <= 80) {
    checks.push(check("success", "passed", "quality_about_length", "Длина раздела «О себе» в норме", `${formatWords(aboutWords)} — оптимальная длина для краткого описания.`));
  } else {
    checks.push(check("warning", "warning", "quality_about_length", "О себе слишком длинное", `${formatWords(aboutWords)}. Лучше сделать краткое описание на 2–4 предложения.`));
  }

  if (experience.length === 0) {
    checks.push(check("info", "info", "quality_experience_desc", "Качество опыта не проверялось", "Сначала добавьте запись опыта работы."));
    checks.push(check("info", "info", "quality_experience_length", "Подробнее об описании опыта", "Сначала добавьте запись опыта работы."));
    checks.push(check("info", "info", "quality_experience_verbs", "Глаголы действия не проверялись", "Сначала добавьте запись опыта работы."));
  } else {
    const emptyDescExp = experience.filter((e) => !safeText(e.description));
    checks.push(
      emptyDescExp.length === 0
        ? check("success", "passed", "quality_experience_desc", "Описания опыта заполнены", "Все записи опыта имеют описание.")
        : check("error", "error", "quality_experience_desc", "Есть опыт без описания", `${formatEntries(emptyDescExp.length)} без описания. Добавьте задачи, стек и результаты.`)
    );

    const shortDescExp = experience.filter((e) => {
      const desc = safeText(e.description);
      return desc && wordCount(desc) < 20;
    });
    checks.push(
      shortDescExp.length === 0
        ? check("success", "passed", "quality_experience_length", "Описания опыта достаточно подробные", "Все описания содержат развёрнутые формулировки.")
        : check("warning", "warning", "quality_experience_length", "Некоторые описания опыта слишком короткие", `${formatEntries(shortDescExp.length)} с описанием менее 20 слов. Добавьте задачи, контекст и результаты.`)
    );

    const hasVerbs = experience.some((e) => {
      const desc = safeText(e.description);
      if (!desc) return false;
      const t = desc.toLowerCase();
      const verbs = ["разработ", "реализ", "внедр", "оптимиз", "улучш", "автоматиз", "интегр", "тестир", "deploy", "develop", "implement", "build", "design", "refactor"];
      return verbs.some((v) => t.includes(v));
    });
    checks.push(
      hasVerbs
        ? check("success", "passed", "quality_experience_verbs", "Описания содержат глаголы действия", "Формулировки описаний включают конкретные действия.")
        : check("info", "info", "quality_experience_verbs", "Добавьте глаголы действия", "Используйте глаголы: разработал, внедрил, оптимизировал, реализовал и т.д.")
    );
  }

  const skillNames = skills.map(getSkillName).filter(Boolean);
  const uniqueSkills = new Set(skillNames.map((s) => s.toLowerCase()));
  const hasDuplicates = skillNames.length !== uniqueSkills.size;
  checks.push(
    !hasDuplicates
      ? check("success", "passed", "quality_skills_duplicates", "Навыки без дублей", "Все указанные навыки уникальны.")
      : check("warning", "warning", "quality_skills_duplicates", "Есть дубли навыков", "Удалите повторяющиеся навыки из списка.")
  );

  const emptyEntries = [
    ...experience.filter((e) => !safeText(e.position) && !safeText(e.company) && !safeText(e.description)),
  ];
  checks.push(
    emptyEntries.length === 0
      ? check("success", "passed", "quality_empty_entries", "Нет пустых записей", "Все элементы резюме содержат данные.")
      : check("warning", "warning", "quality_empty_entries", "Есть пустые записи", `${formatEntries(emptyEntries.length)}. Удалите или заполните их.`)
  );

  const passed = checks.filter((c) => c.status === "passed").length;
  const score = Math.round((passed / checks.length) * 100);

  return { score, checks };
}

function checkAtsReadiness(data) {
  const { template } = data;
  const checks = [];

  const meta = TEMPLATE_META[template];
  if (meta) {
    const severity = meta.atsLevel === "low_risk" ? "success" : "info";
    const status = meta.atsLevel === "low_risk" ? "passed" : "info";
    checks.push(check(severity, status, `ats_template_${template}`, `Шаблон: ${meta.label}`, meta.description));
  }

  checks.push(
    check("info", "info", "ats_pdf_react_pdf", "PDF — текстовый документ", "PDF создаётся через react-pdf с использованием Text/Link. Это текстовый PDF, а не изображение.")
  );

  checks.push(
    check("info", "info", "ats_recommend_docx", "DOCX безопаснее для ATS-порталов", "Формат DOCX обычно лучше парсится автоматическими системами. Рекомендуется для откликов через ATS-формы.")
  );

  if (template !== "minimalist") {
    checks.push(
      check("info", "info", "ats_recommend_minimalist_docx", "Для максимальной совместимости", "Используйте Минималистичный шаблон + DOCX для откликов через ATS-порталы.")
    );
  }

  checks.push(
    check("info", "info", "ats_job_format", "Следуйте требованиям вакансии", "Если работодатель указал предпочтительный формат файла, следуйте его требованиям.")
  );

  const passed = checks.filter((c) => c.status === "passed").length;
  const infoCount = checks.filter((c) => c.status === "info").length;
  const score = Math.round(((passed + infoCount * 0.5) / checks.length) * 100);

  return { score: Math.min(100, score), checks };
}

function checkGithub(data) {
  const { github } = data;
  const checks = [];

  checks.push(
    github.length > 0
      ? check("success", "passed", "github_selected", "GitHub проекты выбраны", `${formatProjects(github.length)} добавлено в резюме.`)
      : check("info", "info", "github_selected", "GitHub проекты не добавлены", "Подключите GitHub и выберите проекты для резюме.")
  );

  if (github.length > 0) {
    const withDesc = github.filter((r) => safeText(r.description)).length;
    checks.push(
      withDesc > 0
        ? check("success", "passed", "github_descriptions", "Есть описания проектов", `${withDesc} из ${formatProjects(github.length)} имеют описание.`)
        : check("warning", "warning", "github_descriptions", "Проекты без описаний", "Добавьте описание хотя бы к части проектов — это помогает рекрутерам понять ваш вклад.")
    );

    const withLang = github.filter((r) => safeText(r.language)).length;
    checks.push(
      withLang > 0
        ? check("success", "passed", "github_language", "Указаны языки проектов", `${withLang} из ${formatProjects(github.length)} имеют указанный язык.`)
        : check("info", "info", "github_language", "Языки проектов не указаны", "Указание основного языка проекта помогает рекрутеру быстрее оценить стек.")
    );
  }

  const passed = checks.filter((c) => c.status === "passed").length;
  const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 50;

  return { score, checks };
}

function checkJobMatch(data, jobMatchResult) {
  const checks = [];

  if (!jobMatchResult) {
    checks.push(check("info", "info", "jobmatch_not_performed", "Анализ вакансии не выполнен", "Для проверки резюме под конкретную вакансию выполните «Анализ вакансии»."));
    return { score: null, notChecked: true, checks };
  }

  const { evidenceScore = 0, confirmedExperience = [], confirmedProjects = [], declaredOnly = [], missingEvidence = [] } = jobMatchResult;

  checks.push(
    evidenceScore >= 70
      ? check("success", "passed", "jobmatch_evidence_high", "Evidence Score высокий", `${evidenceScore}% — резюме хорошо подтверждает требования вакансии.`)
      : evidenceScore >= 40
        ? check("warning", "warning", "jobmatch_evidence_mid", "Evidence Score средний", `${evidenceScore}% — часть требований вакансии не подтверждена опытом.`)
        : check("warning", "warning", "jobmatch_evidence_low", "Evidence Score низкий", `${evidenceScore}% — вакансия слабо подтверждается резюме. Не адаптируйте резюме искусственно.`)
  );

  if (confirmedExperience.length > 0) {
    checks.push(check("success", "passed", "jobmatch_confirmed", "Есть подтверждённый опыт", `${formatSkills(confirmedExperience.length)} подтверждены опытом работы.`));
  }

  if (declaredOnly.length > 0) {
    checks.push(check("warning", "warning", "jobmatch_declared_only", "Есть навыки только в списке навыков", `${formatSkills(declaredOnly.length)} указаны только в навыках, но не в опыте. При наличии реального опыта можно отразить его в описании.`));
  }

  if (missingEvidence.length > 0) {
    checks.push(check("warning", "warning", "jobmatch_missing", "Есть отсутствующие навыки", `${formatSkills(missingEvidence.length)} не найдены в резюме. Добавляйте только при наличии реального опыта.`));
  }

  if (confirmedProjects.length > 0) {
    checks.push(check("success", "passed", "jobmatch_confirmed_projects", "Есть подтверждение через проекты", `${formatSkills(confirmedProjects.length)} подтверждены проектами или GitHub.`));
  }

  const passed = checks.filter((c) => c.status === "passed").length;
  const score = Math.round((passed / checks.length) * 100);

  return { score, checks };
}

function calcOverallScore(categories) {
  const hasJobMatch = categories.jobMatch && !categories.jobMatch.notChecked;
  const weights = hasJobMatch
    ? { completeness: 0.35, contentQuality: 0.30, atsReadiness: 0.20, github: 0.10, jobMatch: 0.05 }
    : { completeness: 0.37, contentQuality: 0.32, atsReadiness: 0.21, github: 0.10 };

  let total = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const cat = categories[key];
    if (cat !== null && cat !== undefined) {
      total += cat.score * weight;
      weightSum += weight;
    }
  }

  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

function getLevel(score) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "needs_improvement";
  return "weak";
}

export function analyzeResumeHealth(resumeData, jobMatchResult = null) {
  const data = normalizeResumeData(resumeData);

  const completeness = checkCompleteness(data);
  const contentQuality = checkContentQuality(data);
  const atsReadiness = checkAtsReadiness(data);
  const github = checkGithub(data);
  const jobMatch = checkJobMatch(data, jobMatchResult);

  const categories = {
    completeness: { score: completeness.score, checks: completeness.checks },
    contentQuality: { score: contentQuality.score, checks: contentQuality.checks },
    atsReadiness: { score: atsReadiness.score, checks: atsReadiness.checks },
    github: { score: github.score, checks: github.checks },
    jobMatch: { score: jobMatch.score, checks: jobMatch.checks, notChecked: jobMatch.notChecked || false },
  };

  const allChecks = [
    ...completeness.checks,
    ...contentQuality.checks,
    ...atsReadiness.checks,
    ...github.checks,
    ...jobMatch.checks,
  ];

  const topIssues = allChecks.filter((c) => c.severity === "error" || c.severity === "warning");

  const score = calcOverallScore(categories);

  return {
    score,
    level: getLevel(score),
    categories,
    checks: allChecks,
    topIssues,
  };
}

export { TEMPLATE_META };
