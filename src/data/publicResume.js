// Static, explicitly reviewed content only. Never load a private resume by ID here.
// The owner approved this text and its public contacts on 2026-10-22.
export const publicResumeApproved = true;

export const publicResume = {
  template: "classic",
  showSkillLevels: false,
  profile: {
    name: "Прокофьев Матвей Михайлович",
    photo: "/cv/matvey-prokofyev.jpg",
    avatarShape: "square",
    about: "Junior QA Engineer / Инженер по тестированию. Начинающий специалист с высшим профильным IT-образованием и самостоятельной практикой тестирования веб-приложений. Проверяю пользовательские сценарии, готовлю тестовую документацию, изучаю HTTP, REST API и SQL. Разработал дипломный CV Builder на React и Supabase/PostgreSQL. Ищу первую работу в QA с дальнейшим развитием в автоматизацию.",
    email: "prokofievm1@yandex.ru",
    phone: "",
    telegram: "@painhood",
    location: "Тольятти, Самарская область",
    githubUrl: "https://github.com/painmoney",
  },
  skills: [
    "Ручное функциональное и негативное тестирование",
    "Тест-дизайн, тест-кейсы, чек-листы, баг-репорты",
    "HTTP, REST API, JSON, клиент-серверная архитектура",
    "Postman, Swagger/OpenAPI, Chrome DevTools",
    "SQL, PostgreSQL",
    "Базовые знания: Git, Linux, Agile и Scrum",
    "Английский: B1",
  ],
  education: [{
    institution: "Тольяттинский государственный университет",
    degree: "Прикладная информатика, профиль «Разработка программного обеспечения»",
    year: "2022–2026, высшее образование, диплом получен",
  }],
  experience: [],
  github: [],
  projects: [{
    id: "saucedemo",
    name: "SauceDemo — самостоятельная практика Manual QA",
    description: "Тестирование авторизации, каталога, корзины и оформления заказа. 57 пунктов чек-листа, 7 подробных тест-кейсов, 2 отчёта об аномалиях, результаты выполнения и матрица трассировки. Сохранены оригинальные PDF-доказательства. Неоднозначные ожидания отделены от подтверждённых дефектов.",
    link: "https://github.com/painmoney/saucedemo-manual-qa",
    links: [
      { label: "QA-портфолио SauceDemo", url: "https://github.com/painmoney/saucedemo-manual-qa" },
      { label: "Тестируемый сайт SauceDemo", url: "https://www.saucedemo.com/" },
    ],
  }, {
    id: "cv-builder",
    name: "CV Builder — дипломный проект и тестирование",
    description: "Разработка: React, JavaScript, Supabase/PostgreSQL; авторизация, CRUD резюме, пять шаблонов, предпросмотр и экспорт. Защита доступа — Supabase Auth и RLS; в репозитории настроены CI и технические тесты.\nПодготовлены чек-лист на 55 проверок и 17 тест-кейсов. Проведены проверки интерфейса и REST API, подготовлена коллекция Postman, выполнены SQL-запросы. Обнаружен и зарегистрирован дефект мобильного предпросмотра. Результаты и доказательства представлены в QA-портфолио.",
    link: "https://github.com/painmoney/diplome-cv-builder/tree/chore/qa-staging-setup",
    links: [
      { label: "Исходный код CV Builder", url: "https://github.com/painmoney/diplome-cv-builder/tree/chore/qa-staging-setup" },
      { label: "QA-портфолио CV Builder", url: "https://github.com/painmoney/cv-builder-manual-qa" },
    ],
  }],
};
