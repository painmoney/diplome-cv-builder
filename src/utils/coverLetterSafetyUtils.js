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
