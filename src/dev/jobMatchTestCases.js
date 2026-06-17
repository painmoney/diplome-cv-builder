export const JOB_MATCH_TEST_CASES = [
  {
    id: "work-experience",
    title: "Case A — Work experience",
    description: "Опыт и навыки подтверждают требования вакансии",
    expectedMode: "ai",
    expected: [
      "technicalScore выше 70%",
      "evidenceScore выше 70%",
      "cover letter mode: ai",
      "confirmedExperience: React, TypeScript, REST API",
      "нет careful warning",
    ],
    resumeData: {
      profile: {
        name: "Петрова Мария",
        email: "petrova@example.com",
        phone: "+7 (999) 111-22-33",
        about: "Frontend-разработчик с опытом создания SPA на React. Работаю с TypeScript, REST API, Git.",
      },
      skills: [
        { name: "React", level: 5 },
        { name: "JavaScript", level: 5 },
        { name: "TypeScript", level: 4 },
        { name: "CSS", level: 4 },
        { name: "REST API", level: 4 },
        { name: "Git", level: 4 },
        { name: "HTML", level: 5 },
        { name: "Jest", level: 4 },
        { name: "Testing Library", level: 3 },
      ],
      experience: [
        {
          company: "StartupHub",
          position: "Frontend Developer",
          period: "2022–2025",
          description: "Разработка и поддержка SPA на React + TypeScript. Интеграция с REST API, работа с Redux, написание unit-тестов (Jest, Testing Library). Оптимизация производительности.",
        },
      ],
      education: [
        {
          institution: "СПбГУ",
          degree: "Бакалавр",
          department: "Прикладная математика",
          years: "2019–2023",
        },
      ],
      github: [
        {
          name: "react-todo-app",
          url: "https://github.com/petrova/react-todo-app",
          description: "Todo-приложение на React + TypeScript",
          stars: 5,
        },
      ],
      projects: [],
      template: "minimalist",
    },
    jobText: `Frontend Developer (React)

Требования:
- React, JavaScript, TypeScript
- HTML, CSS
- REST API
- Git
- Jest / Testing Library

Обязанности:
- Разработка пользовательских интерфейсов на React
- Интеграция с REST API
- Написание unit-тестов
- Code review`,
  },
  {
    id: "github-evidence",
    title: "Case B — GitHub evidence",
    description: "Технологии подтверждены только через GitHub-репозитории, опыта нет",
    expectedMode: "careful",
    expected: [
      "technicalScore выше 40%",
      "evidenceScore: есть project evidence",
      "confirmedProjects: TypeScript, Node.js",
      "experience пустая — нет confirmedExperience",
      "cover letter: careful mode",
      "AI не должен писать 'опыт работы с TypeScript'",
    ],
    resumeData: {
      profile: {
        name: "Новиков Артём",
        email: "novikov@example.com",
        phone: "+7 (988) 222-33-44",
        about: "Начинающий разработчик с базовыми знаниями JavaScript и TypeScript.",
      },
      skills: [
        { name: "TypeScript", level: 3 },
        { name: "Node.js", level: 3 },
        { name: "JavaScript", level: 4 },
        { name: "HTML", level: 4 },
        { name: "CSS", level: 3 },
      ],
      experience: [],
      education: [
        {
          institution: "МГУ",
          degree: "Бакалавр",
          department: "Прикладная математика",
          years: "2020–2024",
        },
      ],
      github: [
        {
          name: "express-api-demo",
          url: "https://github.com/novikov/express-api-demo",
          description: "REST API на Node.js + Express + TypeScript",
          stars: 3,
        },
        {
          name: "react-dashboard",
          url: "https://github.com/novikov/react-dashboard",
          description: "Админ-панель на React + TypeScript",
          stars: 7,
        },
      ],
      projects: [],
      template: "minimalist",
    },
    jobText: `Fullstack Developer

Требования:
- TypeScript, JavaScript
- Node.js / Express
- React
- REST API
- Git

Обязанности:
- Разработка fullstack-приложений
- Проектирование API
- Работа с базами данных`,
  },
  {
    id: "manual-project",
    title: "Case C — Manual project",
    description: "Технологии подтверждены только через ручные проекты, без опыта и GitHub",
    expectedMode: "careful",
    expected: [
      "technicalScore выше 40%",
      "confirmedProjects: React, Supabase, Vite",
      "experience пустая — нет confirmedExperience",
      "github пустой",
      "cover letter: careful mode",
      "AboutMe может писать 'проектный опыт'",
      "AboutMe НЕ должен писать 'опыт работы'",
    ],
    resumeData: {
      profile: {
        name: "Соколова Анна",
        email: "sokolova@example.com",
        phone: "+7 (977) 444-55-66",
        about: "Студентка 4 курса, изучаю React и fullstack-разработку.",
      },
      skills: [
        { name: "React", level: 3 },
        { name: "Supabase", level: 2 },
        { name: "Vite", level: 3 },
        { name: "Material UI", level: 3 },
        { name: "JavaScript", level: 4 },
        { name: "HTML", level: 4 },
        { name: "CSS", level: 4 },
      ],
      experience: [],
      education: [
        {
          institution: "МИФИ",
          degree: "Бакалавр",
          department: "Информатика и вычислительная техника",
          years: "2021–2025",
        },
      ],
      github: [],
      projects: [
        {
          id: "proj_cv_builder",
          name: "CV Builder",
          role: "Frontend / Fullstack Developer",
          description: "Разработал веб-приложение для создания IT-резюме с редактором, шаблонами и экспортом в PDF/DOCX/Markdown.",
          techStack: "React, Supabase, Vite, Material UI",
          period: "2025",
          link: "https://cv-builder.example.com",
        },
        {
          id: "proj_portfolio",
          name: "Личный сайт-портфолио",
          role: "Frontend Developer",
          description: "Создал адаптивный сайт-портфолио с анимациями и контактной формой.",
          techStack: "React, Vite, CSS",
          period: "2024",
          link: "",
        },
      ],
      template: "minimalist",
    },
    jobText: `Frontend Developer

Требования:
- React
- Supabase / PostgreSQL
- Vite
- Material UI
- HTML, CSS, JavaScript

Обязанности:
- Разработка интерфейсов на React
- Интеграция с бэкенд-сервисами
- Оптимизация производительности`,
  },
  {
    id: "skills-only",
    title: "Case D — Skills only",
    description: "Технологии только в навыках, нет ни опыта, ни проектов",
    expectedMode: "careful",
    expected: [
      "declaredOnly: Docker, Kubernetes, CI/CD",
      "net confirmedExperience",
      "net confirmedProjects для этих технологий",
      "cover letter: careful mode",
      "AI должен использовать формулировки 'имею навыки', 'знаком'",
    ],
    resumeData: {
      profile: {
        name: "Михайлов Дмитрий",
        email: "mikhailov@example.com",
        phone: "+7 (966) 555-66-77",
        about: "Frontend-разработчик с опытом работы с React и базовыми знаниями DevOps-инструментов.",
      },
      skills: [
        { name: "React", level: 4 },
        { name: "JavaScript", level: 4 },
        { name: "TypeScript", level: 3 },
        { name: "CSS", level: 4 },
        { name: "Docker", level: 2 },
        { name: "Kubernetes", level: 1 },
        { name: "CI/CD", level: 2 },
        { name: "Git", level: 4 },
      ],
      experience: [
        {
          company: "WebStudio",
          position: "Frontend Developer",
          period: "2023–2025",
          description: "Разработка интерфейсов на React + TypeScript. Интеграция с REST API.",
        },
      ],
      education: [
        {
          institution: "НГУ",
          degree: "Бакалавр",
          department: "Информатика",
          years: "2019–2023",
        },
      ],
      github: [],
      projects: [],
      template: "minimalist",
    },
    jobText: `DevOps Engineer

Требования:
- Docker, Kubernetes
- CI/CD (GitLab CI, GitHub Actions)
- Linux
- Terraform

Обязанности:
- Настройка и поддержка CI/CD пайплайнов
- Управление контейнерами и оркестрацией
- Настройка инфраструктуры`,
  },
  {
    id: "missing-evidence",
    title: "Case E — Missing evidence",
    description: "Технологии完全 отсутствуют в резюме",
    expectedMode: "careful",
    expected: [
      "missing: Kubernetes, Terraform, AWS",
      "нет ни confirmedExperience, ни confirmedProjects по этим технологиям",
      "cover letter: careful mode",
      "AI не должен упоминать отсутствующие технологии как опыт",
    ],
    resumeData: {
      profile: {
        name: "Козлов Дмитрий",
        email: "kozlov@example.com",
        phone: "+7 (911) 222-33-44",
        about: "Backend-разработчик на Java Spring Boot. Опыт проектирования REST API и работы с реляционными базами данных.",
      },
      skills: [
        { name: "Java", level: 5 },
        { name: "Spring Boot", level: 5 },
        { name: "REST API", level: 4 },
        { name: "PostgreSQL", level: 4 },
        { name: "SQL", level: 4 },
        { name: "Git", level: 4 },
        { name: "Maven", level: 4 },
      ],
      experience: [
        {
          company: "FinTech Solutions",
          position: "Java Developer",
          period: "2021–2025",
          description: "Разработка микросервисов на Java Spring Boot. Проектирование REST API для финансовых сервисов. Интеграция с PostgreSQL.",
        },
      ],
      education: [
        {
          institution: "МИФИ",
          degree: "Магистр",
          department: "Информационная безопасность",
          years: "2019–2021",
        },
      ],
      github: [
        {
          name: "spring-boot-starter",
          url: "https://github.com/kozlov/spring-boot-starter",
          description: "Шаблон Spring Boot приложения",
          stars: 15,
        },
      ],
      projects: [],
      template: "minimalist",
    },
    jobText: `Platform Engineer

Требования:
- Kubernetes
- Terraform / Ansible
- AWS / GCP
- Docker
- CI/CD
- Мониторинг (Prometheus, Grafana)

Обязанности:
- Настройка и поддержка Kubernetes-кластеров
- Управление инфраструктурой через Terraform
- Настройка мониторинга и алертинга`,
  },
  {
    id: "mixed-portfolio",
    title: "Case F — Mixed portfolio",
    description: "Опыт + ручные проекты + GitHub — проверка приоритета и разделения источников",
    expectedMode: "ai",
    expected: [
      "confirmedExperience: React",
      "confirmedProjects: TypeScript, Supabase, Node.js",
      "experience priority сохраняется",
      "project evidence НЕ становится work experience",
      "cover letter: ai mode",
      "React — можно 'опыт работы с React'",
      "TypeScript/Supabase/Node.js — только 'проектный опыт'",
    ],
    resumeData: {
      profile: {
        name: "Иванова Елена",
        email: "ivanova@example.com",
        phone: "+7 (955) 666-77-88",
        about: "Frontend-разработчик с опытом React. Активно развиваю навыки fullstack-разработки через личные проекты.",
      },
      skills: [
        { name: "React", level: 5 },
        { name: "TypeScript", level: 4 },
        { name: "Supabase", level: 3 },
        { name: "Node.js", level: 3 },
        { name: "JavaScript", level: 5 },
        { name: "CSS", level: 4 },
        { name: "REST API", level: 4 },
        { name: "Git", level: 4 },
      ],
      experience: [
        {
          company: "Digital Agency",
          position: "Frontend Developer",
          period: "2023–2025",
          description: "Разработка пользовательских интерфейсов на React. Интеграция с REST API, работа с CSS-анимациями.",
        },
      ],
      education: [
        {
          institution: "МГТУ",
          degree: "Бакалавр",
          department: "Информатика",
          years: "2019–2023",
        },
      ],
      github: [
        {
          name: "node-api-starter",
          url: "https://github.com/ivanova/node-api-starter",
          description: "Шаблон REST API на Node.js + TypeScript + Express",
          stars: 4,
        },
      ],
      projects: [
        {
          id: "proj_saas_dashboard",
          name: "SaaS Dashboard",
          role: "Fullstack Developer",
          description: "Разработал панель управления для SaaS-приложения с авторизацией, дашбордами и интеграцией с Supabase.",
          techStack: "React, Supabase, TypeScript, Node.js",
          period: "2025",
          link: "https://saas-dashboard.example.com",
        },
      ],
      template: "minimalist",
    },
    jobText: `Fullstack Developer

Требования:
- React, TypeScript
- Node.js / Express
- Supabase / PostgreSQL
- REST API
- Git

Обязанности:
- Разработка fullstack-приложений
- Проектирование и реализация API
- Интеграция с базами данных
- Работа с фронтендом и бэкендом`,
  },
];
