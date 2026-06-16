export const JOB_MATCH_TEST_CASES = [
  {
    id: "python-hard-mismatch",
    title: "Case A — Python backend mismatch",
    description: "Низкое совпадение: Python/FastAPI/Docker/MongoDB отсутствуют в резюме",
    expectedMode: "careful",
    expected: [
      "technicalScore около 40–45%",
      "evidenceScore около 40–45%",
      "cover letter mode: careful",
      "missing: Python, FastAPI, Django, MongoDB, Docker",
    ],
    resumeData: {
      profile: {
        name: "Смирнов Алексей",
        email: "smirnov@example.com",
        phone: "+7 (900) 123-45-67",
        about: "Frontend/Fullstack разработчик с опытом создания интерфейсов на React и бэкенд-сервисов на Java Spring Boot. Работал с REST API, PostgreSQL, Git.",
      },
      skills: [
        { name: "React", level: 5 },
        { name: "JavaScript", level: 5 },
        { name: "CSS", level: 4 },
        { name: "Material UI", level: 4 },
        { name: "PostgreSQL", level: 3 },
        { name: "SQL", level: 3 },
        { name: "Spring Boot", level: 3 },
        { name: "REST API", level: 4 },
        { name: "Git", level: 4 },
      ],
      experience: [
        {
          company: "TechCorp",
          position: "Frontend Developer",
          period: "2023–2025",
          description: "Разработка пользовательских интерфейсов на React с использованием Material UI. Интеграция с REST API, работа с PostgreSQL для хранения данных. Оптимизация производительности SPA.",
        },
        {
          company: "WebStudio",
          position: "Java Developer",
          period: "2022–2023",
          description: "Разработка бэкенд-сервисов на Java Spring Boot. Проектирование REST API, работа с PostgreSQL. Написание unit-тестов.",
        },
      ],
      education: [
        {
          institution: "МГТУ им. Баумана",
          degree: "Бакалавр",
          department: "Информатика",
          years: "2018–2022",
        },
      ],
      github: [
        {
          name: "react-dashboard",
          url: "https://github.com/smirnov/react-dashboard",
          description: "Админ-панель на React + Material UI",
          stars: 12,
        },
        {
          name: "spring-rest-api",
          url: "https://github.com/smirnov/spring-rest-api",
          description: "REST API на Spring Boot с PostgreSQL",
          stars: 8,
        },
      ],
      template: "minimalist",
    },
    jobText: `Python Developer

Требования:
- Python 3.10+
- FastAPI / Django
- PostgreSQL, MongoDB
- Docker, Docker Compose
- REST API
- Git

Обязанности:
- Разработка и поддержка бэкенд-сервисов на Python
- Проектирование и оптимизация баз данных
- Написание автотестов
- Code review`,
  },
  {
    id: "python-skills-stuffing",
    title: "Case B — Python skills-stuffing",
    description: "Python/Docker/MongoDB добавлены в skills, но не подтверждены опытом",
    expectedMode: "careful",
    expected: [
      "technicalScore выше (около 60–70%)",
      "evidenceScore выше (около 50%)",
      "cover letter mode: careful",
      "declaredOnly: Python, Docker, PostgreSQL, MongoDB, SQL",
      "missing: FastAPI",
      "обычный AI cover letter НЕ включается",
    ],
    resumeData: {
      profile: {
        name: "Смирнов Алексей",
        email: "smirnov@example.com",
        phone: "+7 (900) 123-45-67",
        about: "Frontend/Fullstack разработчик с опытом создания интерфейсов на React и бэкенд-сервисов на Java Spring Boot. Работал с REST API, PostgreSQL, Git.",
      },
      skills: [
        { name: "React", level: 5 },
        { name: "JavaScript", level: 5 },
        { name: "CSS", level: 4 },
        { name: "Material UI", level: 4 },
        { name: "PostgreSQL", level: 3 },
        { name: "SQL", level: 3 },
        { name: "Spring Boot", level: 3 },
        { name: "REST API", level: 4 },
        { name: "Git", level: 4 },
        { name: "Python", level: 2 },
        { name: "Docker", level: 2 },
        { name: "MongoDB", level: 2 },
      ],
      experience: [
        {
          company: "TechCorp",
          position: "Frontend Developer",
          period: "2023–2025",
          description: "Разработка пользовательских интерфейсов на React с использованием Material UI. Интеграция с REST API, работа с PostgreSQL для хранения данных.",
        },
        {
          company: "WebStudio",
          position: "Java Developer",
          period: "2022–2023",
          description: "Разработка бэкенд-сервисов на Java Spring Boot. Проектирование REST API, работа с PostgreSQL.",
        },
      ],
      education: [
        {
          institution: "МГТУ им. Баумана",
          degree: "Бакалавр",
          department: "Информатика",
          years: "2018–2022",
        },
      ],
      github: [
        {
          name: "react-dashboard",
          url: "https://github.com/smirnov/react-dashboard",
          description: "Админ-панель на React + Material UI",
          stars: 12,
        },
      ],
      template: "minimalist",
    },
    jobText: `Python Developer

Требования:
- Python 3.10+
- FastAPI / Django
- PostgreSQL, MongoDB
- Docker, Docker Compose
- REST API
- Git

Обязанности:
- Разработка и поддержка бэкенд-сервисов на Python
- Проектирование и оптимизация баз данных
- Написание автотестов`,
  },
  {
    id: "frontend-strong-match",
    title: "Case C — Frontend strong match",
    description: "Опыт и навыки подтверждают требования вакансии",
    expectedMode: "ai",
    expected: [
      "technicalScore выше 70%",
      "evidenceScore выше 70%",
      "cover letter mode: ai",
      "нет careful warning",
      "кнопка: Сгенерировать сопроводительное письмо",
    ],
    resumeData: {
      profile: {
        name: "Петрова Мария",
        email: "petrova@example.com",
        phone: "+7 (999) 111-22-33",
        about: "Frontend-разработчик с 3+ годами опыта создания SPA на React. Работаю с TypeScript, REST API, Git. Опыт работы в команде из 5 человек.",
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
    id: "java-backend-partial",
    title: "Case D — Java backend partial",
    description: "Java/Spring Boot подтверждены, PostgreSQL/Docker/SQL — только в skills",
    expectedMode: "ai",
    expected: [
      "technicalScore выше 80%",
      "evidenceScore выше 60%",
      "cover letter mode: ai",
      "confirmedExperience: Java, Spring Boot, REST API",
      "declaredOnly: PostgreSQL, Docker, SQL",
      "missingEvidence: []",
      "validateCoverLetterText не должен позволять overclaim по declaredOnly",
      "AI advice НЕ должен содержать [missing] или 'Нет отсутствующих навыков'",
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
        { name: "PostgreSQL", level: 3 },
        { name: "Docker", level: 2 },
        { name: "SQL", level: 3 },
        { name: "Git", level: 4 },
        { name: "Maven", level: 4 },
      ],
      experience: [
        {
          company: "FinTech Solutions",
          position: "Java Developer",
          period: "2021–2025",
          description: "Разработка микросервисов на Java Spring Boot. Проектирование REST API для финансовых сервисов. Интеграция с внешними API, написание unit-тестов.",
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
      template: "minimalist",
    },
    jobText: `Backend Developer (Java)

Требования:
- Java 17+
- Spring Boot
- PostgreSQL, SQL
- Docker
- REST API
- Git

Обязанности:
- Разработка бэкенд-сервисов на Java Spring Boot
- Проектирование REST API
- Оптимизация SQL-запросов
- Написание автотестов`,
  },
  {
    id: "devops-mismatch",
    title: "Case E — DevOps mismatch",
    description: "Нет DevOps-опыта, только Docker/CI-CD в skills",
    expectedMode: "careful",
    expected: [
      "technicalScore около 30–40%",
      "evidenceScore около 15–25%",
      "cover letter mode: careful",
      "missing: Kubernetes, Linux, AWS",
      "нет готов освоить",
    ],
    resumeData: {
      profile: {
        name: "Волков Игорь",
        email: "volkov@example.com",
        phone: "+7 (922) 333-44-55",
        about: "Frontend-разработчик с небольшим опытом DevOps-задач: настройка Docker для локальной разработки, базовые GitHub Actions.",
      },
      skills: [
        { name: "React", level: 4 },
        { name: "JavaScript", level: 4 },
        { name: "Docker", level: 2 },
        { name: "CI/CD", level: 2 },
        { name: "Git", level: 4 },
        { name: "HTML", level: 4 },
        { name: "CSS", level: 4 },
      ],
      experience: [
        {
          company: "WebAgency",
          position: "Frontend Developer",
          period: "2023–2025",
          description: "Разработка интерфейсов на React. Настройка Docker-окружения для проекта. Базовые GitHub Actions для деплоя.",
        },
      ],
      education: [
        {
          institution: "Казанский университет",
          degree: "Бакалавр",
          department: "Информатика",
          years: "2020–2024",
        },
      ],
      github: [],
      template: "minimalist",
    },
    jobText: `DevOps Engineer

Требования:
- Docker, Kubernetes
- Linux (Ubuntu/CentOS)
- AWS / GCP
- CI/CD (GitLab CI, GitHub Actions)
- Terraform / Ansible
- Мониторинг (Prometheus, Grafana)

Обязанности:
- Настройка и поддержка CI/CD пайплайнов
- Управление контейнерами и оркестрацией
- Настройка инфраструктуры в облаке
- Мониторинг и алертинг`,
  },
];
