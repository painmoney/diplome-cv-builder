export const TECH_KEYWORDS = {
  languages: [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go",
    "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Scala", "Dart",
    "Elixir", "Haskell", "R", "MATLAB", "SQL", "Shell", "Bash",
  ],
  frameworks: [
    "React", "Vue", "Angular", "Next.js", "Nuxt.js", "Svelte", "Remix",
    "Node.js", "Express", "NestJS", "Fastify",
    "Django", "Flask", "FastAPI",
    "Spring", "Spring Boot",
    "Laravel", "Symfony",
    "Rails",
    "Electron", "React Native",
    "JPA", "Hibernate", "Akka", "JavaFX",
  ],
  databases: [
    "PostgreSQL", "MySQL", "MariaDB", "MongoDB", "Redis",
    "Elasticsearch", "DynamoDB", "Cassandra", "SQLite",
    "ClickHouse", "Neo4j", "MS SQL Server", "Supabase", "NoSQL",
  ],
  cloud: [
    "AWS", "Azure", "GCP", "Google Cloud",
    "Docker", "Kubernetes", "Terraform", "Ansible",
    "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI",
    "Nginx", "Linux", "Vagrant",
    "Kafka", "Docker Compose",
  ],
  tools: [
    "Git", "GitHub", "GitLab", "Jira", "Confluence",
    "Figma", "Slack", "VS Code", "Postman",
    "npm", "yarn", "pnpm", "Maven", "Gradle",
    "JVM", "GC",
  ],
  methodologies: [
    "Agile", "Scrum", "Kanban", "TDD", "BDD", "DDD",
    "Microservices", "REST API", "GraphQL", "gRPC", "WebSocket",
    "OAuth", "JWT", "SAML",
    "HTML", "CSS", "SCSS", "SASS", "Tailwind", "Bootstrap", "MUI",
    "Material UI", "Styled Components",
    "Redux", "MobX", "Zustand", "Pinia",
    "Jest", "Vitest", "Cypress", "Playwright", "Selenium", "Mocha", "Testing Library",
    "Webpack", "Vite", "Babel", "ESLint", "Prettier",
    "MVC", "MVVM", "OOP", "SOLID",
    "Multithreading", "Reactive Programming", "Highload",
  ],
};

export const SYNONYMS = {
  "rest": "REST API",
  "docker-compose": "docker compose",
};

export const SUPPRESSIONS = {
  "github actions": ["github"],
  "gitlab ci": ["gitlab"],
  "rest api": ["rest"],
  "spring boot": ["spring"],
  "next.js": ["next"],
  "nuxt.js": ["nuxt"],
  "react native": ["react"],
  "material ui": ["mui"],
  "styled components": ["styled"],
  "ms sql server": ["sql"],
  "google cloud": ["gcp"],
};

export const SOFT_SKILLS = [
  "communication", "teamwork", "leadership", "problem-solving",
  "critical thinking", "adaptability", "time management", "mentoring",
  "attention to detail", "self-motivated", "proactive",
  "presentation", "negotiation", "analytical",
  "english",
];

export const REQUIREMENTS = [
  "experience", "work experience", "higher education",
  "remote", "responsibility", "organization", "punctuality",
  "client orientation", "quick learning", "initiative",
  "testing", "manual testing", "automated testing",
];

export const RUSSIAN_PHRASES = {
  "опыт работы": "experience",
  "командная работа": "teamwork",
  "английский": "english",
  "английский язык": "english",
  "английский язык уровне": "english",
  "удалённая работа": "remote",
  "удаленная работа": "remote",
  "удалённо": "remote",
  "базы данных": "databases",
  "высшее образование": "higher education",
  "тестирование": "testing",
  "ручное тестирование": "manual testing",
  "автотесты": "automated testing",
  "автоматизация тестирования": "automated testing",
  "ответственность": "responsibility",
  "коммуникация": "communication",
  "внимательность": "attention to detail",
  "аналитическое мышление": "analytical thinking",
  "стрессоустойчивость": "stress resistance",
  "управление проектами": "project management",
  "пользовательский интерфейс": "user interface",
  "фронтенд разработка": "frontend development",
  "бэкенд разработка": "backend development",
  "микросервисная архитектура": "microservices",
  "контейнеризация": "containerization",
  "взаимодействие с командой": "teamwork",
  "быстрое обучение": "quick learning",
  "инициативность": "initiative",
  "организованность": "organization",
  "пунктуальность": "punctuality",
  "клиентоориентированность": "client orientation",
  "ооп": "OOP",
  "многопоточность": "Multithreading",
  "многопоточный код": "Multithreading",
  "реактивное программирование": "Reactive Programming",
  "реактивная архитектура": "Reactive Programming",
  "высоконагруженные системы": "Highload",
  "реляционные базы данных": "SQL",
  "нереляционные базы данных": "NoSQL",
};

export const CATEGORY_LABELS = {
  languages: "Языки программирования",
  frameworks: "Фреймворки / библиотеки",
  databases: "Базы данных",
  cloud: "Облака / DevOps",
  tools: "Инструменты",
  methodologies: "Методологии / подходы",
  soft_skills: "Soft Skills",
  requirements: "Общие требования",
};

export const ALL_KEYWORDS = new Map();

for (const [category, keywords] of Object.entries(TECH_KEYWORDS)) {
  for (const kw of keywords) {
    ALL_KEYWORDS.set(kw.toLowerCase(), { category, original: kw });
  }
}
for (const kw of SOFT_SKILLS) {
  ALL_KEYWORDS.set(kw.toLowerCase(), { category: "soft_skills", original: kw });
}
for (const kw of REQUIREMENTS) {
  ALL_KEYWORDS.set(kw.toLowerCase(), { category: "requirements", original: kw });
}

export const MULTI_WORD_KEYWORDS = [];
for (const [kwLower, meta] of ALL_KEYWORDS) {
  if (kwLower.includes(" ")) {
    MULTI_WORD_KEYWORDS.push({ keyword: kwLower, ...meta });
  }
}

export const AMBIGUOUS_SINGLE_WORD_KEYWORDS = new Set([
  "go",
  "r",
  "node",
  "rest",
]);
