// Static, explicitly reviewed content only. Never load a private resume by ID here.
// The owner approved this text and its public contacts on 2026-10-22.
export const publicResumeApproved = true;

export const publicResume = {
  template: "classic",
  showSkillLevels: false,
  profile: {
    name: "Прокофьев Матвей Михайлович",
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
  }, {
    id: "cv-builder",
    name: "CV Builder — собственный дипломный веб-проект",
    techStack: "React, JavaScript/JSX, Supabase, PostgreSQL",
    description: "Разработал веб-приложение для создания IT-резюме: авторизация, создание и редактирование документов, сохранение данных, пять шаблонов, предпросмотр и экспорт. Защита доступа реализована через Supabase Auth и RLS. В репозитории настроены CI и технические тесты.",
    link: "https://github.com/painmoney/diplome-cv-builder/tree/chore/qa-staging-setup",
  }, {
    id: "cv-builder-qa",
    name: "CV Builder — QA-кейс собственного дипломного проекта",
    description: "Для тестирования собственного веб-приложения CV Builder подготовлены тест-план, чек-лист из 56 проверок и 13 тест-кейсов. В рамках технического прогона выполнена 51 проверка (50 Passed, 1 Failed), ещё 5 заблокированы внешними зависимостями. Исследованы пользовательские сценарии, REST API/RPC, SQL/PostgreSQL, экспорт документов и разграничение доступа. Зарегистрирован воспроизводимый дефект мобильного предпросмотра.\nТестовая документация, результаты, ограничения и доказательства опубликованы на GitHub.",
    link: "https://github.com/painmoney/cv-builder-manual-qa",
  }],
};
