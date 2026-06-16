// ── Technology Registry — единый источник правды для технологий ─────
//
// Stage A: Foundation — registry создан, compatibility exports экспортируются.
// Runtime-код (jobMatchUtils, coverLetterSafetyUtils) пока НЕ подключается к registry.
// Подключение будет в Stage B.

const TECHNOLOGY_REGISTRY = {
  // ── Languages ────────────────────────────────────────────────────
  javascript: {
    displayName: "JavaScript",
    category: "languages",
    aliases: ["js"],
    tipType: "programming-language",
  },
  typescript: {
    displayName: "TypeScript",
    category: "languages",
    aliases: ["ts"],
    tipType: "programming-language",
  },
  python: {
    displayName: "Python",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  java: {
    displayName: "Java",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  "c++": {
    displayName: "C++",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  "c#": {
    displayName: "C#",
    category: "languages",
    aliases: ["csharp", "c sharp"],
    tipType: "programming-language",
  },
  go: {
    displayName: "Go",
    category: "languages",
    aliases: ["golang"],
    tipType: "programming-language",
  },
  rust: {
    displayName: "Rust",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  php: {
    displayName: "PHP",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  ruby: {
    displayName: "Ruby",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  swift: {
    displayName: "Swift",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  kotlin: {
    displayName: "Kotlin",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  scala: {
    displayName: "Scala",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  dart: {
    displayName: "Dart",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  elixir: {
    displayName: "Elixir",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  haskell: {
    displayName: "Haskell",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  r: {
    displayName: "R",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  matlab: {
    displayName: "MATLAB",
    category: "languages",
    aliases: [],
    tipType: "programming-language",
  },
  sql: {
    displayName: "SQL",
    category: "languages",
    aliases: [],
    tipType: "database",
  },
  shell: {
    displayName: "Shell",
    category: "languages",
    aliases: [],
    tipType: "devops-tool",
  },
  bash: {
    displayName: "Bash",
    category: "languages",
    aliases: [],
    tipType: "devops-tool",
  },

  // ── Frameworks ───────────────────────────────────────────────────
  react: {
    displayName: "React",
    category: "frameworks",
    aliases: ["react.js", "reactjs"],
    tipType: "frontend-framework",
  },
  vue: {
    displayName: "Vue",
    category: "frameworks",
    aliases: ["vue.js", "vuejs"],
    tipType: "frontend-framework",
  },
  angular: {
    displayName: "Angular",
    category: "frameworks",
    aliases: ["angular.js", "angularjs"],
    tipType: "frontend-framework",
  },
  "next.js": {
    displayName: "Next.js",
    category: "frameworks",
    aliases: ["nextjs", "next"],
    tipType: "frontend-framework",
  },
  "nuxt.js": {
    displayName: "Nuxt.js",
    category: "frameworks",
    aliases: ["nuxtjs", "nuxt"],
    tipType: "frontend-framework",
  },
  svelte: {
    displayName: "Svelte",
    category: "frameworks",
    aliases: ["sveltejs", "svelte.js"],
    tipType: "frontend-framework",
  },
  remix: {
    displayName: "Remix",
    category: "frameworks",
    aliases: [],
    tipType: "frontend-framework",
  },
  "node.js": {
    displayName: "Node.js",
    category: "frameworks",
    aliases: ["nodejs", "node"],
    tipType: "backend-framework",
  },
  express: {
    displayName: "Express",
    category: "frameworks",
    aliases: ["express.js", "expressjs"],
    tipType: "backend-framework",
  },
  nestjs: {
    displayName: "NestJS",
    category: "frameworks",
    aliases: ["nest.js", "nest"],
    tipType: "backend-framework",
  },
  fastify: {
    displayName: "Fastify",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },
  django: {
    displayName: "Django",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },
  flask: {
    displayName: "Flask",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },
  fastapi: {
    displayName: "FastAPI",
    category: "frameworks",
    aliases: ["fast api"],
    tipType: "backend-framework",
  },
  spring: {
    displayName: "Spring",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },
  "spring boot": {
    displayName: "Spring Boot",
    category: "frameworks",
    aliases: ["springboot"],
    tipType: "backend-framework",
  },
  laravel: {
    displayName: "Laravel",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },
  symfony: {
    displayName: "Symfony",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },
  rails: {
    displayName: "Rails",
    category: "frameworks",
    aliases: ["ruby on rails"],
    tipType: "backend-framework",
  },
  electron: {
    displayName: "Electron",
    category: "frameworks",
    aliases: [],
    tipType: "frontend-framework",
  },
  "react native": {
    displayName: "React Native",
    category: "frameworks",
    aliases: ["react-native", "rn"],
    tipType: "mobile-framework",
  },
  jpa: {
    displayName: "JPA",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },
  hibernate: {
    displayName: "Hibernate",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },
  akka: {
    displayName: "Akka",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },
  javafx: {
    displayName: "JavaFX",
    category: "frameworks",
    aliases: [],
    tipType: "backend-framework",
  },

  // ── Databases ────────────────────────────────────────────────────
  postgresql: {
    displayName: "PostgreSQL",
    category: "databases",
    aliases: ["postgres"],
    tipType: "database",
  },
  mysql: {
    displayName: "MySQL",
    category: "databases",
    aliases: [],
    tipType: "database",
  },
  mariadb: {
    displayName: "MariaDB",
    category: "databases",
    aliases: [],
    tipType: "database",
  },
  mongodb: {
    displayName: "MongoDB",
    category: "databases",
    aliases: ["mongo"],
    tipType: "database",
  },
  redis: {
    displayName: "Redis",
    category: "databases",
    aliases: [],
    tipType: "database",
  },
  elasticsearch: {
    displayName: "Elasticsearch",
    category: "databases",
    aliases: ["elastic"],
    tipType: "database",
  },
  dynamodb: {
    displayName: "DynamoDB",
    category: "databases",
    aliases: ["dynamo"],
    tipType: "database",
  },
  cassandra: {
    displayName: "Cassandra",
    category: "databases",
    aliases: [],
    tipType: "database",
  },
  sqlite: {
    displayName: "SQLite",
    category: "databases",
    aliases: [],
    tipType: "database",
  },
  clickhouse: {
    displayName: "ClickHouse",
    category: "databases",
    aliases: [],
    tipType: "database",
  },
  neo4j: {
    displayName: "Neo4j",
    category: "databases",
    aliases: [],
    tipType: "database",
  },
  "ms sql server": {
    displayName: "MS SQL Server",
    category: "databases",
    aliases: ["mssql", "sql server", "microsoft sql server"],
    tipType: "database",
  },
  nosql: {
    displayName: "NoSQL",
    category: "databases",
    aliases: [],
    tipType: "database",
  },

  // ── Cloud / DevOps ──────────────────────────────────────────────
  aws: {
    displayName: "AWS",
    category: "cloud",
    aliases: ["amazon web services"],
    tipType: "cloud-platform",
  },
  azure: {
    displayName: "Azure",
    category: "cloud",
    aliases: ["microsoft azure"],
    tipType: "cloud-platform",
  },
  gcp: {
    displayName: "GCP",
    category: "cloud",
    aliases: [],
    tipType: "cloud-platform",
  },
  "google cloud": {
    displayName: "Google Cloud",
    category: "cloud",
    aliases: ["google cloud platform"],
    tipType: "cloud-platform",
  },
  docker: {
    displayName: "Docker",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  kubernetes: {
    displayName: "Kubernetes",
    category: "cloud",
    aliases: ["k8s"],
    tipType: "devops-tool",
  },
  terraform: {
    displayName: "Terraform",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  ansible: {
    displayName: "Ansible",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  "ci/cd": {
    displayName: "CI/CD",
    category: "cloud",
    aliases: ["ci cd", "cicd"],
    tipType: "devops-tool",
  },
  jenkins: {
    displayName: "Jenkins",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  "github actions": {
    displayName: "GitHub Actions",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  "gitlab ci": {
    displayName: "GitLab CI",
    category: "cloud",
    aliases: ["gitlab-ci"],
    tipType: "devops-tool",
  },
  nginx: {
    displayName: "Nginx",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  linux: {
    displayName: "Linux",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  vagrant: {
    displayName: "Vagrant",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  kafka: {
    displayName: "Kafka",
    category: "cloud",
    aliases: ["apache kafka"],
    tipType: "message-broker",
  },

  // ── Tools ────────────────────────────────────────────────────────
  git: {
    displayName: "Git",
    category: "tools",
    aliases: [],
    tipType: "version-control",
  },
  github: {
    displayName: "GitHub",
    category: "tools",
    aliases: [],
    tipType: "version-control",
  },
  gitlab: {
    displayName: "GitLab",
    category: "tools",
    aliases: [],
    tipType: "version-control",
  },
  jira: {
    displayName: "Jira",
    category: "tools",
    aliases: [],
    tipType: "generic",
  },
  confluence: {
    displayName: "Confluence",
    category: "tools",
    aliases: [],
    tipType: "generic",
  },
  figma: {
    displayName: "Figma",
    category: "tools",
    aliases: [],
    tipType: "generic",
  },
  slack: {
    displayName: "Slack",
    category: "tools",
    aliases: [],
    tipType: "generic",
  },
  "vs code": {
    displayName: "VS Code",
    category: "tools",
    aliases: ["vscode", "visual studio code"],
    tipType: "generic",
  },
  postman: {
    displayName: "Postman",
    category: "tools",
    aliases: [],
    tipType: "generic",
  },
  npm: {
    displayName: "npm",
    category: "tools",
    aliases: [],
    tipType: "build-tool",
  },
  yarn: {
    displayName: "yarn",
    category: "tools",
    aliases: [],
    tipType: "build-tool",
  },
  pnpm: {
    displayName: "pnpm",
    category: "tools",
    aliases: [],
    tipType: "build-tool",
  },
  maven: {
    displayName: "Maven",
    category: "tools",
    aliases: [],
    tipType: "build-tool",
  },
  gradle: {
    displayName: "Gradle",
    category: "tools",
    aliases: [],
    tipType: "build-tool",
  },
  jvm: {
    displayName: "JVM",
    category: "tools",
    aliases: [],
    tipType: "generic",
  },
  gc: {
    displayName: "GC",
    category: "tools",
    aliases: [],
    tipType: "generic",
  },

  // ── Methodologies / Protocols / Libraries ────────────────────────
  agile: {
    displayName: "Agile",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  scrum: {
    displayName: "Scrum",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  kanban: {
    displayName: "Kanban",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  tdd: {
    displayName: "TDD",
    category: "methodologies",
    aliases: [],
    tipType: "testing-tool",
  },
  bdd: {
    displayName: "BDD",
    category: "methodologies",
    aliases: [],
    tipType: "testing-tool",
  },
  ddd: {
    displayName: "DDD",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  microservices: {
    displayName: "Microservices",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  "rest api": {
    displayName: "REST API",
    category: "methodologies",
    aliases: ["restful", "rest"],
    tipType: "api-protocol",
  },
  graphql: {
    displayName: "GraphQL",
    category: "methodologies",
    aliases: [],
    tipType: "api-protocol",
  },
  grpc: {
    displayName: "gRPC",
    category: "methodologies",
    aliases: [],
    tipType: "api-protocol",
  },
  websocket: {
    displayName: "WebSocket",
    category: "methodologies",
    aliases: ["web socket"],
    tipType: "api-protocol",
  },
  oauth: {
    displayName: "OAuth",
    category: "methodologies",
    aliases: [],
    tipType: "api-protocol",
  },
  jwt: {
    displayName: "JWT",
    category: "methodologies",
    aliases: [],
    tipType: "api-protocol",
  },
  saml: {
    displayName: "SAML",
    category: "methodologies",
    aliases: [],
    tipType: "api-protocol",
  },
  html: {
    displayName: "HTML",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  css: {
    displayName: "CSS",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  scss: {
    displayName: "SCSS",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  sass: {
    displayName: "Sass",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  tailwind: {
    displayName: "Tailwind",
    category: "methodologies",
    aliases: ["tailwindcss", "tailwind css"],
    tipType: "frontend-framework",
  },
  bootstrap: {
    displayName: "Bootstrap",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  mui: {
    displayName: "MUI",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  "material ui": {
    displayName: "Material UI",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  "styled components": {
    displayName: "Styled Components",
    category: "methodologies",
    aliases: ["styled-components"],
    tipType: "frontend-framework",
  },
  redux: {
    displayName: "Redux",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  mobx: {
    displayName: "MobX",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  zustand: {
    displayName: "Zustand",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  pinia: {
    displayName: "Pinia",
    category: "methodologies",
    aliases: [],
    tipType: "frontend-framework",
  },
  jest: {
    displayName: "Jest",
    category: "methodologies",
    aliases: [],
    tipType: "testing-tool",
  },
  vitest: {
    displayName: "Vitest",
    category: "methodologies",
    aliases: [],
    tipType: "testing-tool",
  },
  cypress: {
    displayName: "Cypress",
    category: "methodologies",
    aliases: [],
    tipType: "testing-tool",
  },
  playwright: {
    displayName: "Playwright",
    category: "methodologies",
    aliases: [],
    tipType: "testing-tool",
  },
  selenium: {
    displayName: "Selenium",
    category: "methodologies",
    aliases: [],
    tipType: "testing-tool",
  },
  mocha: {
    displayName: "Mocha",
    category: "methodologies",
    aliases: [],
    tipType: "testing-tool",
  },
  webpack: {
    displayName: "Webpack",
    category: "methodologies",
    aliases: [],
    tipType: "build-tool",
  },
  vite: {
    displayName: "Vite",
    category: "methodologies",
    aliases: [],
    tipType: "build-tool",
  },
  babel: {
    displayName: "Babel",
    category: "methodologies",
    aliases: [],
    tipType: "build-tool",
  },
  eslint: {
    displayName: "ESLint",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  prettier: {
    displayName: "Prettier",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  mvc: {
    displayName: "MVC",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  mvvm: {
    displayName: "MVVM",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  oop: {
    displayName: "OOP",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  solid: {
    displayName: "SOLID",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  multithreading: {
    displayName: "Multithreading",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  "reactive programming": {
    displayName: "Reactive Programming",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  highload: {
    displayName: "Highload",
    category: "methodologies",
    aliases: [],
    tipType: "generic",
  },
  "docker compose": {
    displayName: "Docker Compose",
    category: "cloud",
    aliases: ["docker-compose"],
    tipType: "devops-tool",
  },
  "testing library": {
    displayName: "Testing Library",
    category: "methodologies",
    aliases: [],
    tipType: "testing-tool",
  },
  prometheus: {
    displayName: "Prometheus",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  grafana: {
    displayName: "Grafana",
    category: "cloud",
    aliases: [],
    tipType: "devops-tool",
  },
  rabbitmq: {
    displayName: "RabbitMQ",
    category: "cloud",
    aliases: [],
    tipType: "message-broker",
  },
};

// ── Helper functions ───────────────────────────────────────────────

/**
 * Возвращает canonical key по key или alias.
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeTechnologyKey(value) {
  const normalized = String(value || "").toLowerCase().trim();
  if (!normalized) return null;

  // прямое совпадение по key
  if (TECHNOLOGY_REGISTRY[normalized]) return normalized;

  // поиск по aliases
  for (const [key, tech] of Object.entries(TECHNOLOGY_REGISTRY)) {
    if (tech.aliases && tech.aliases.includes(normalized)) {
      return key;
    }
  }

  return null;
}

/**
 * Возвращает meta-объект технологии по key или alias.
 * @param {string} value
 * @returns {{ displayName: string, category: string, aliases: string[], tipType: string } | null}
 */
export function getTechnologyMeta(value) {
  const key = normalizeTechnologyKey(value);
  if (!key) return null;
  return { ...TECHNOLOGY_REGISTRY[key] };
}

/**
 * Возвращает displayName или безопасный fallback.
 * @param {string} value
 * @returns {string}
 */
export function getTechnologyDisplayName(value) {
  const meta = getTechnologyMeta(value);
  if (meta) return meta.displayName;

  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Возвращает category или null.
 * @param {string} value
 * @returns {string|null}
 */
export function getTechnologyCategory(value) {
  const meta = getTechnologyMeta(value);
  return meta ? meta.category : null;
}

/**
 * Возвращает tipType или "generic".
 * @param {string} value
 * @returns {string}
 */
export function getTechnologyTipType(value) {
  const meta = getTechnologyMeta(value);
  return meta ? meta.tipType : "generic";
}

// ── Compatibility exports ──────────────────────────────────────────

/**
 * Compatibility map: key → displayName.
 * Используется для замены KEYWORD_DISPLAY_NAMES в будущем.
 */
export const TECHNOLOGY_DISPLAY_NAMES = {};
for (const [key, tech] of Object.entries(TECHNOLOGY_REGISTRY)) {
  TECHNOLOGY_DISPLAY_NAMES[key] = tech.displayName;
}

/**
 * Compatibility map: alias → canonical key.
 * Используется для расширения SYNONYMS в будущем.
 */
export const TECHNOLOGY_ALIASES = {};
for (const [key, tech] of Object.entries(TECHNOLOGY_REGISTRY)) {
  for (const alias of (tech.aliases || [])) {
    TECHNOLOGY_ALIASES[alias] = key;
  }
}

/**
 * Все ключи registry (для итерации в тестах).
 */
export const TECHNOLOGY_KEYS = Object.keys(TECHNOLOGY_REGISTRY);

export { TECHNOLOGY_REGISTRY };
