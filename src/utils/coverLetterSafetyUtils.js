import { getTechnologyMeta } from "./technologyRegistry";

const KEYWORD_DISPLAY_NAMES = {
  git: "Git",
  github: "GitHub",
  postgresql: "PostgreSQL",
  sql: "SQL",
  javascript: "JavaScript",
  typescript: "TypeScript",
  docker: "Docker",
  mongodb: "MongoDB",
  fastapi: "FastAPI",
  python: "Python",
  react: "React",
  "spring boot": "Spring Boot",
  java: "Java",
  "rest api": "REST API",
  "ci/cd": "CI/CD",
  nosql: "NoSQL",
  "material ui": "Material UI",
  kubernetes: "Kubernetes",
  linux: "Linux",
  aws: "AWS",
  "gitlab ci": "GitLab CI",
  nginx: "Nginx",
  terraform: "Terraform",
  ansible: "Ansible",
  django: "Django",
  gcp: "GCP",
  "github actions": "GitHub Actions",
  html: "HTML",
  css: "CSS",
  jest: "Jest",
  testing: "Testing",
  "testing library": "Testing Library",
  "docker compose": "Docker Compose",
  prometheus: "Prometheus",
  grafana: "Grafana",
  vite: "Vite",
  webpack: "Webpack",
  redux: "Redux",
  "next.js": "Next.js",
  nextjs: "Next.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  express: "Express",
  nestjs: "NestJS",
  graphql: "GraphQL",
  redis: "Redis",
  rabbitmq: "RabbitMQ",
  kafka: "Kafka",
};

export function formatKeywordName(value) {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase();

  const registryMeta = getTechnologyMeta(key);
  if (registryMeta) return registryMeta.displayName;

  return KEYWORD_DISPLAY_NAMES[key] || raw;
}

export function formatKeywordList(items) {
  const list = [...new Set((items || []).map(formatKeywordName).filter(Boolean))];
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} и ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} и ${list[list.length - 1]}`;
}

export function getPositionPhrase(positionName) {
  const position = String(positionName || "").trim();
  return position ? `вакансия ${position}` : "ваша вакансия";
}

export function buildWeakProfileSentence() {
  return "В моём текущем резюме сильнее представлены веб-разработка, работа с API и проектный опыт.";
}

export function cleanupGeneratedText(text) {
  return String(text || "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]+\./g, ".")
    .replace(/[ \t]+,/g, ",")
    .replace(/\.{2,}/g, ".")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getCoverLetterMode({
  evidenceScore,
  technicalScore,
  confirmedExperience = [],
  confirmedProjects = [],
  declaredOnly = [],
  missingEvidence = [],
}) {
  const confirmedCount = confirmedExperience.length + confirmedProjects.length;
  const declaredCount = declaredOnly.length;
  const missingCount = missingEvidence.length;
  const total = confirmedCount + declaredCount + missingCount;

  const reasons = [];

  if (total === 0) {
    reasons.push("no matches at all");
  }
  if (technicalScore != null && technicalScore < 50) {
    reasons.push(`technicalScore ${technicalScore} < 50`);
  }
  if (evidenceScore != null && evidenceScore < 60) {
    reasons.push(`evidenceScore ${evidenceScore} < 60`);
  }
  if (confirmedCount === 0 && total > 0) {
    reasons.push("no confirmed experience or projects");
  }
  if (declaredCount > confirmedCount && confirmedCount > 0) {
    reasons.push(`declaredOnly (${declaredCount}) > confirmed (${confirmedCount})`);
  }
  if (missingCount > 0 && declaredCount >= confirmedCount) {
    reasons.push(`missing (${missingCount}) present and declaredOnly >= confirmed`);
  }
  if (missingCount >= 2) {
    reasons.push(`missingCount ${missingCount} >= 2`);
  }

  const mode = reasons.length > 0 ? "careful" : "ai";

  return { mode, reasons };
}

export function buildWeakMatchCoverLetter({
  name,
  confirmedExperience = [],
  confirmedProjects = [],
  declaredOnly = [],
  companyName,
  positionName,
}) {
  const hasCompany = companyName && companyName.trim().length > 0;

  const greeting = "Здравствуйте!";
  const positionRef = getPositionPhrase(positionName);
  const companyRef = hasCompany ? ` в ${companyName}` : "";
  const profileSentence = buildWeakProfileSentence();

  const confirmed = [...confirmedExperience, ...confirmedProjects];
  const confirmedText = formatKeywordList(confirmed);
  const declaredText = formatKeywordList(declaredOnly);

  const lines = [
    greeting,
    "",
    `Меня заинтересовала ${positionRef}${companyRef}. ${profileSentence}`,
  ];

  if (confirmed.length > 0 && declaredOnly.length > 0) {
    lines.push("");
    lines.push(`Из требований вакансии в резюме подтверждаются ${confirmedText}. ${declaredText} указаны как навыки. Поэтому я рассматриваю позицию как смежную с моим текущим профилем и готов обсудить задачи, где мой подтверждённый опыт может быть полезен.`);
  } else if (confirmed.length > 0) {
    lines.push("");
    lines.push(`Из требований вакансии в резюме подтверждаются ${confirmedText}. Поэтому я рассматриваю позицию как смежную с моим текущим профилем и готов обсудить задачи, где мой подтверждённый опыт может быть полезен.`);
  } else if (declaredOnly.length > 0) {
    lines.push("");
    lines.push(`${declaredText} указаны как навыки в резюме. Позиция выглядит смежной с моим текущим профилем, поэтому я готов обсудить задачи, где мой проектный опыт может быть полезен.`);
  } else {
    lines.push("");
    lines.push("Позиция выглядит смежной с моим текущим профилем, поэтому я рассматриваю её только при готовности команды оценить релевантный проектный и веб-разработческий опыт.");
  }

  if (name) {
    lines.push("", "С уважением,", name);
  }

  return cleanupGeneratedText(lines.join("\n"));
}

export function buildSafeCoverLetterFallback({
  name,
  positionName,
  confirmedExperience = [],
  confirmedProjects = [],
  declaredOnly = [],
}) {
  const confirmed = [...confirmedExperience, ...confirmedProjects];

  if (confirmed.length === 0) {
    return buildWeakMatchCoverLetter({
      name,
      confirmedExperience,
      confirmedProjects,
      declaredOnly,
      companyName: "",
      positionName,
    });
  }

  const greeting = "Здравствуйте!";
  const positionRef = getPositionPhrase(positionName);
  const confirmedText = formatKeywordList(confirmed);
  const declaredText = formatKeywordList(declaredOnly);

  const lines = [
    greeting,
    "",
    `Меня заинтересовала ${positionRef}. В моём резюме подтверждены ${confirmedText}, поэтому я могу быть полезен в задачах, связанных с этими технологиями.`,
  ];

  if (declaredOnly.length > 0) {
    lines.push("");
    lines.push(`${declaredText} указаны как навыки. При необходимости я могу подробнее раскрыть связанный опыт в описании проектов или задач.`);
  }

  if (name) {
    lines.push("", "С уважением,", name);
  }

  return cleanupGeneratedText(lines.join("\n"));
}

const UNSAFE_COVER_LETTER_PHRASES = [
  "готов освоить",
  "готов быстро освоить",
  "у меня нет опыта",
  "нет опыта работы с",
  "стремлюсь развиваться",
  "желание развиваться",
  "я подхожу",
  "идеально подхожу",
  "полностью соответствую",
  "мой опыт соответствует",
  "уверен, что могу внести",
  "уверена, что могу внести",
  "внести полезный вклад",
  "внести значительный вклад",
];

export function validateCoverLetterText(text, {
  positionName = "",
  confirmedExperience = [],
  confirmedProjects = [],
  declaredOnly = [],
  missingEvidence = [],
  mode = "ai",
}) {
  const violations = [];
  const lower = String(text || "").toLowerCase();
  const positionLower = String(positionName || "").toLowerCase();

  const confirmedSet = new Set(
    [...confirmedExperience, ...confirmedProjects].map((k) => String(k).toLowerCase())
  );
  const declaredSet = new Set(declaredOnly.map((k) => String(k).toLowerCase()));
  const missingSet = new Set(missingEvidence.map((k) => String(k).toLowerCase()));

  for (const phrase of UNSAFE_COVER_LETTER_PHRASES) {
    if (lower.includes(phrase)) {
      violations.push(`banned phrase: "${phrase}"`);
    }
  }

  const overclaimPatterns = [
    "опыт работы с ",
    "работал с ",
    "работала с ",
    "мой опыт с ",
    "практический опыт с ",
    "занимался ",
    "занималась ",
  ];

  for (const kw of declaredSet) {
    if (!kw) continue;
    for (const pattern of overclaimPatterns) {
      const idx = lower.indexOf(pattern);
      if (idx !== -1) {
        const after = lower.slice(idx + pattern.length);
        if (after.startsWith(kw) || after.includes(kw)) {
          if (!confirmedSet.has(kw)) {
            violations.push(`overclaim for declaredOnly: "${kw}" with pattern "${pattern}"`);
          }
        }
      }
    }
  }

  for (const kw of missingSet) {
    if (!kw) continue;
    const isInPosition = positionLower.includes(kw);
    const lines = lower.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(kw)) {
        if (mode === "ai" && isInPosition && i <= 2) continue;
        violations.push(`missingEvidence keyword "${kw}" found in letter body`);
      }
    }
  }

  return { ok: violations.length === 0, violations };
}

export function buildJobMatchAdviceFallback({
  confirmedExperience = [],
  confirmedProjects = [],
  declaredOnly = [],
  missingEvidence = [],
  evidenceScore,
}) {
  const lines = [];
  let n = 1;

  if (confirmedExperience.length > 0) {
    const names = formatKeywordList(confirmedExperience);
    const verb = confirmedExperience.length > 1 ? "подтверждены" : "подтверждён";
    lines.push(`${n}. [confirmed_experience] — ${names} ${verb} в опыте. Можно расширить описание: указать задачи, контекст и результат, если эти данные действительно есть.`);
    n++;
  }

  if (confirmedProjects.length > 0) {
    const names = formatKeywordList(confirmedProjects);
    const verb = confirmedProjects.length > 1 ? "подтверждены" : "подтверждён";
    lines.push(`${n}. [confirmed_project] — ${names} ${verb} в проектах/GitHub. Можно подробнее описать роль и стек, если это соответствует реальности.`);
    n++;
  }

  if (declaredOnly.length > 0) {
    const names = formatKeywordList(declaredOnly);
    const verb = declaredOnly.length > 1 ? "указаны" : "указан";
    const pronoun = declaredOnly.length > 1 ? "их" : "его";
    lines.push(`${n}. [declared_skill] — ${names} ${verb} только в навыках. При наличии реального опыта можно отразить ${pronoun} в описании опыта или проекта.`);
    n++;
  }

  if (missingEvidence.length > 0) {
    const names = formatKeywordList(missingEvidence);
    const verb = missingEvidence.length > 1 ? "не найдены" : "не найден";
    const pronoun = missingEvidence.length > 1 ? "эти навыки" : "этот навык";
    lines.push(`${n}. [missing] — ${names} ${verb} в резюме. Добавляйте ${pronoun} только при наличии реального опыта.`);
    n++;
  }

  if (evidenceScore != null && evidenceScore < 40) {
    lines.push(`${n}. [general] — Evidence Score низкий — вакансия слабо подтверждается резюме, не адаптируйте резюме искусственно.`);
  }

  return lines.join("\n");
}

export function validateJobMatchAdviceText(text, {
  confirmedExperience = [],
  confirmedProjects = [],
  declaredOnly = [],
  missingEvidence = [],
}) {
  const violations = [];

  function containsAny(t, keywords) {
    return keywords.some((kw) => {
      const k = String(kw).toLowerCase();
      return k && t.includes(k);
    });
  }

  const adviceLines = text.split("\n").filter((l) => l.trim());

  for (const line of adviceLines) {
    const ll = line.toLowerCase();

    if (ll.includes("[confirmed_experience]") && containsAny(ll, [...declaredOnly, ...missingEvidence])) {
      violations.push("[confirmed_experience] references declaredOnly/missingEvidence keyword");
    }

    if (ll.includes("[confirmed_project]") && containsAny(ll, missingEvidence)) {
      violations.push("[confirmed_project] references missingEvidence keyword");
    }

    if (ll.includes("[declared_skill]")) {
      const experiencePhrases = ["опыт работы с", "подтверждён в опыте", "работал с", "опыт с "];
      if (experiencePhrases.some((p) => ll.includes(p))) {
        violations.push("[declared_skill] claims experience for declaredOnly keyword");
      }
    }

    if (ll.includes("[missing]")) {
      if (!ll.includes("при наличии реального опыта")) {
        violations.push("[missing] line lacks caveat");
      }
    }
  }

  if (confirmedExperience.length === 0 && text.includes("[confirmed_experience]")) {
    const lines = adviceLines.filter((l) => l.includes("[confirmed_experience]"));
    for (const line of lines) {
      const hasRealKeyword = confirmedExperience.some((kw) => line.toLowerCase().includes(String(kw).toLowerCase()));
      if (!hasRealKeyword) {
        const generic = ["расширить описание", "подробнее описать роль", "указать задачи"];
        if (generic.some((g) => line.toLowerCase().includes(g))) {
          violations.push("[confirmed_experience] present but confirmedExperience is empty — generic line");
        }
      }
    }
  }

  if (confirmedProjects.length === 0 && text.includes("[confirmed_project]")) {
    const lines = adviceLines.filter((l) => l.includes("[confirmed_project]"));
    for (const line of lines) {
      const generic = ["расширить описание", "подробнее описать роль", "подробнее описать стек"];
      if (generic.some((g) => line.toLowerCase().includes(g))) {
        violations.push("[confirmed_project] present but confirmedProjects is empty — generic line");
      }
    }
  }

  if (declaredOnly.length === 0 && text.includes("[declared_skill]")) {
    violations.push("[declared_skill] present but declaredOnly is empty");
  }

  if (missingEvidence.length === 0 && text.includes("[missing]")) {
    violations.push("[missing] present but missingEvidence is empty");
  }

  if (missingEvidence.length === 0 && text.toLowerCase().includes("нет отсутствующих навыков")) {
    violations.push("fake missing text: 'нет отсутствующих навыков'");
  }

  if (missingEvidence.length > 0 && !text.includes("[missing]")) {
    violations.push("missingEvidence present but no [missing] line");
  }

  if (missingEvidence.length > 0) {
    const missingLine = adviceLines.find((l) => l.includes("[missing]"));
    if (missingLine) {
      const ll = missingLine.toLowerCase();
      for (const kw of missingEvidence) {
        if (!ll.includes(String(kw).toLowerCase())) {
          violations.push(`[missing] line missing keyword: ${kw}`);
          break;
        }
      }
    }
  }

  if (declaredOnly.length > 0 && !text.includes("[declared_skill]")) {
    violations.push("declaredOnly present but no [declared_skill] line");
  }

  if (confirmedProjects.length > 0 && !text.includes("[confirmed_project]")) {
    violations.push("confirmedProjects present but no [confirmed_project] line");
  }

  if (confirmedExperience.length > 0 && !text.includes("[confirmed_experience]")) {
    violations.push("confirmedExperience present but no [confirmed_experience] line");
  }

  return { ok: violations.length === 0, violations };
}

export function getEvidenceBreakdownSummary({
  confirmedExperience = [],
  confirmedProjects = [],
  declaredOnly = [],
  missingEvidence = [],
}) {
  const groups = [];

  if (confirmedExperience.length > 0) {
    groups.push({
      key: "confirmed_experience",
      label: "Подтверждено опытом",
      keywords: confirmedExperience.map(formatKeywordName),
      color: "success",
      description: "Эти технологии подтверждены описанием опыта работы в резюме.",
    });
  }

  if (confirmedProjects.length > 0) {
    groups.push({
      key: "confirmed_projects",
      label: "Подтверждено проектами / GitHub",
      keywords: confirmedProjects.map(formatKeywordName),
      color: "info",
      description: "Эти технологии найдены в названиях или описаниях ваших проектов.",
    });
  }

  if (declaredOnly.length > 0) {
    groups.push({
      key: "declared_only",
      label: "Указано только в навыках",
      keywords: declaredOnly.map(formatKeywordName),
      color: "warning",
      description: "Эти технологии есть в списке навыков, но не подтверждены опытом или проектами.",
    });
  }

  if (missingEvidence.length > 0) {
    groups.push({
      key: "missing",
      label: "Не найдено в резюме",
      keywords: missingEvidence.map(formatKeywordName),
      color: "error",
      description: "Эти технологии требуются вакансией, но отсутствуют в вашем резюме.",
    });
  }

  return groups;
}

export function buildSafeNextActions({
  confirmedExperience = [],
  confirmedProjects = [],
  declaredOnly = [],
  missingEvidence = [],
  evidenceScore,
}) {
  const actions = [];

  if (missingEvidence.length > 0) {
    const names = formatKeywordList(missingEvidence);
    actions.push({
      type: "warning",
      text: `Не добавляйте ${names} как опыт, если его не было. Лучше подтвердить смежный опыт проектом, курсом или реальной задачей.`,
    });
  }

  if (declaredOnly.length >= confirmedExperience.length && confirmedExperience.length > 0) {
    actions.push({
      type: "info",
      text: "Подкрепите заявленные навыки примерами в опыте или проектах.",
    });
  }

  if (evidenceScore != null && evidenceScore < 60) {
    actions.push({
      type: "info",
      text: "Добавьте в опыт конкретные результаты: метрики, задачи, технологии, масштаб.",
    });
  }

  if (confirmedProjects.length === 0 && confirmedExperience.length > 0) {
    actions.push({
      type: "info",
      text: "Добавьте GitHub-проект, который подтверждает стек вакансии.",
    });
  }

  if (confirmedExperience.length > 0 && evidenceScore != null && evidenceScore >= 70) {
    actions.push({
      type: "success",
      text: "Резюме уже можно использовать для отклика, но проверьте формулировки под вакансию.",
    });
  }

  return actions;
}

export function buildApplicationReadiness({
  technicalScore,
  evidenceScore,
  mode,
  declaredOnly = [],
}) {
  const ts = technicalScore ?? 0;
  const es = evidenceScore ?? 0;

  if (ts >= 75 && es >= 70 && mode === "ai") {
    const hasPartialEvidence = declaredOnly.length > 0;
    return {
      status: "ready",
      label: "Готово к отклику",
      description: hasPartialEvidence
        ? "Техническое совпадение и evidence-база достаточны для отклика. Часть стека указана только в навыках — при возможности подтвердите её примерами в опыте или проектах."
        : "Техническое совпадение и evidence-база достаточны для отклика.",
      color: "success",
    };
  }

  if (ts >= 50 && es >= 45) {
    return {
      status: "partial",
      label: "Можно откликаться, но позиция смежная",
      description: "Часть требований подтверждена, но не все. Позиция может потребовать адаптации.",
      color: "warning",
    };
  }

  return {
    status: "needs_work",
    label: "Лучше доработать резюме под вакансию",
    description: "Совпадение с вакансией слабое. Рекомендуется усилить доказательную базу перед откликом.",
    color: "error",
  };
}

// ── Declared-skill boost tips ─────────────────────────────────────

const DECLARED_SKILL_TIPS = {
  postgresql: {
    description:
      "PostgreSQL указан в навыках, но пока не подтверждён опытом или проектами. Если вы реально использовали PostgreSQL, укажите это в описании проекта или опыта: где он применялся, какие данные хранились, какие запросы или схему вы проектировали.",
    safeActions: [
      "Укажите PostgreSQL в описании проекта, где он реально использовался",
      "Опишите тип задач: проектирование схем, написание запросов, оптимизация",
      "Если PostgreSQL был в рабочем проекте — добавьте контекст и результат",
    ],
    avoid: [
      "Не выставляйте PostgreSQL навыком уровня 4–5, если не уверены",
      "Не пишите «опыт работы с PostgreSQL», если он только в списке навыков",
    ],
  },
  docker: {
    description:
      "Docker указан в навыках, но не подтверждён опытом или проектами. Если вы реально контейнеризировали приложение, укажите это в описании проекта: Dockerfile, docker-compose, запуск сервисов, деплой или локальное окружение.",
    safeActions: [
      "Укажите Docker в описании проекта: что контейнеризировали, зачем",
      "Опишите Dockerfile, docker-compose или инфраструктуру",
      "Если Docker был в рабочем проекте — опишите процесс деплоя или настройки",
    ],
    avoid: [
      "Не пишите «контейнеризация microservices», если не делали этого",
      "Не выставляйте Docker в основной стек без реального проекта",
    ],
  },
  python: {
    description:
      "Python указан в навыках, но не найден в описании опыта или проектов. Если у вас был реальный проект на Python, укажите его в проектах/GitHub и кратко опишите задачу, библиотеку или результат.",
    safeActions: [
      "Укажите Python-проект в GitHub-проектах с описанием задачи",
      "Опишите библиотеки или фреймворки, которые использовали",
      "Опишите результат: что делает скрипт, какой объём данных обрабатывает",
    ],
    avoid: [
      "Не пишите «разработка на Python», если это был одноразовый скрипт",
      "Не выставляйте Python в основной стек, если работали с ним эпизодически",
    ],
  },
  javascript: {
    description:
      "JavaScript указан в навыках, но не подтверждён описанием опыта или проектов. Если он использовался в проекте, укажите его в стеке проекта или в описании интерфейсных задач.",
    safeActions: [
      "Укажите JavaScript в описании проекта, где он реально использовался",
      "Опишите контекст: фронтенд, скрипты, серверная логика на Node.js",
      "Если был в рабочем проекте — добавьте конкретные задачи",
    ],
    avoid: [
      "Не пишите «опыт с JavaScript», если он только в списке навыков",
    ],
  },
  html: {
    description:
      "HTML указан в навыках, но не подтверждён опытом. Если вы верстали страницы или работали с разметкой, укажите это в описании проекта или опыта.",
    safeActions: [
      "Укажите HTML в описании проекта с вёрсткой",
      "Опишите контекст: адаптивная вёрстка, email-шаблоны, статические страницы",
    ],
    avoid: [
      "Не выделяйте HTML как отдельный навык, если он используется вместе с CSS/JS",
    ],
  },
  css: {
    description:
      "CSS указан в навыках, но не подтверждён опытом. Если вы стилизовали интерфейсы, укажите это в описании проекта: фреймворки, адаптивность, анимации.",
    safeActions: [
      "Укажите CSS в описании проекта с конкретными задачами",
      "Опишите подход: Tailwind, SCSS, CSS-in-JS, BEM",
    ],
    avoid: [
      "Не пишите «expert CSS», если не уверены в уровне",
    ],
  },
  "ci/cd": {
    description:
      "CI/CD указан в навыках, но не подтверждён опытом. Если вы настраивали pipeline, укажите GitHub Actions, GitLab CI или описание процесса сборки/деплоя в опыте или проекте.",
    safeActions: [
      "Укажите CI/CD в описании проекта: какой pipeline, что делает",
      "Опишите инструмент: GitHub Actions, GitLab CI, Jenkins",
      "Опишите результат: автоматический деплой, тесты на каждый PR",
    ],
    avoid: [
      "Не пишите «настройка CI/CD для production», если делали только локально",
    ],
  },
  react: {
    description:
      "React указан в навыках, но не подтверждён описанием опыта или проектов. Если вы разрабатывали интерфейсы на React, укажите это в описании проекта или опыта.",
    safeActions: [
      "Укажите React в описании проекта с конкретными задачами",
      "Опишите контекст: SPA, компоненты, хуки, интеграция с API",
    ],
    avoid: [
      "Не пишите «опыт с React», если он только в списке навыков",
    ],
  },
  git: {
    description:
      "Git указан в навыках, но не подтверждён опытом. Если вы использовали Git в проекте, упомяните это в описании: ветвление, pull requests, совместная работа.",
    safeActions: [
      "Упомяните Git в описании проекта как инструмент работы",
      "Если использовали GitHub/GitLab — добавьте ссылку на профиль",
    ],
    avoid: [
      "Не выделяйте Git как отдельный навык, если он используется в каждом проекте",
    ],
  },
  "rest api": {
    description:
      "REST API указан в навыках, но не подтверждён опытом. Если вы интегрировались с API, укажите это в описании проекта: какие API, авторизация, формат данных.",
    safeActions: [
      "Укажите REST API в описании проекта с контекстом интеграции",
      "Опишите: какие эндпоинты, авторизация (JWT, OAuth), формат (JSON)",
    ],
    avoid: [
      "Не пишите «разработка REST API», если только потребляли чужие",
    ],
  },
  gitlab: {
    description:
      "GitLab указан в навыках, но не подтверждён опытом. Если вы использовали GitLab в проекте, упомяните это в описании: репозитории, CI/CD, code review.",
    safeActions: [
      "Упомяните GitLab в описании проекта как платформу",
      "Если настраивали GitLab CI — укажите pipeline в описании",
    ],
    avoid: [
      "Не пишите «работа с GitLab», если только хранили код",
    ],
  },
  sql: {
    description:
      "SQL указан в навыках, но пока не подтверждён опытом или проектами. Если вы реально писали SQL-запросы, укажите это в описании проекта или опыта: выборка, фильтрация, агрегация, оптимизация, схема данных.",
    safeActions: [
      "Укажите SQL в описании проекта, где писали запросы",
      "Опишите задачи: выборка данных, JOIN-ы, агрегация, оптимизация",
      "Если работали со схемой — опишите проектирование или модификацию таблиц",
    ],
    avoid: [
      "Не пишите «опыт работы с SQL», если он только в списке навыков",
      "Не выставляйте SQL как основной навык, если использовали только базовые SELECT",
    ],
  },
  mongodb: {
    description:
      "MongoDB указан в навыках, но не подтверждён опытом или проектами. Если вы реально использовали MongoDB, укажите это в описании проекта: коллекции, запросы, структура данных, задача.",
    safeActions: [
      "Укажите MongoDB в описании проекта, где он реально использовался",
      "Опишите контекст: коллекции, агрегация, структура документов",
      "Если был учебный проект — укажите задачу и результат",
    ],
    avoid: [
      "Не пишите «backend-опыт с MongoDB», если был только учебный пример",
      "Не выставляйте MongoDB в основной стек без реального проекта",
    ],
  },
};

const DEFAULT_DECLARED_TIP = {
  description:
    "Этот навык указан в списке навыков, но пока не подтверждён опытом или проектами. Если он реально использовался — укажите его в описании проекта или опыта с конкретным контекстом.",
  safeActions: [
    "Укажите навык в описании проекта, где он реально применялся",
    "Опишите контекст: какую задачу решали, какой результат получили",
    "Если был в рабочем проекте — добавьте конкретные задачи с этим навыком",
  ],
  avoid: [
    "Не выставляйте навык как опыт, если он только в списке навыков",
    "Не пишите «опыт работы с этим навыком», если он пока не подтверждён в резюме",
  ],
};

/**
 * Возвращает безопасную структурированную подсказку для declaredOnly ключевого слова.
 * Объясняет, как легитимно усилить evidence-базу безfabricации опыта.
 *
 * @param {string} keyword - ключевое слово из declaredOnly (в нижнем регистре)
 * @returns {{ title: string, description: string, safeActions: string[], avoid: string[], targetSuggestions: Array<{tab: number, label: string, targetId: string}> }}
 */
export function buildDeclaredSkillTip(keyword) {
  const normalized = String(keyword || "").toLowerCase().trim();
  const displayName = formatKeywordName(keyword);

  const specific = DECLARED_SKILL_TIPS[normalized] || {
    ...DEFAULT_DECLARED_TIP,
    avoid: [
      "Не выставляйте навык как опыт, если он только в списке навыков",
      `Не пишите «опыт работы с ${displayName}», если он пока не подтверждён в резюме`,
    ],
  };

  return {
    title: `${displayName} — как подтвердить`,
    description: specific.description,
    safeActions: specific.safeActions,
    avoid: specific.avoid,
    targetSuggestions: [
      { tab: 3, label: "Перейти к опыту", targetId: "experience-description" },
      { tab: 4, label: "Перейти к GitHub", targetId: "github-username" },
    ],
  };
}
