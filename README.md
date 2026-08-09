<div align="center">

# CV Builder

### Современный конструктор резюме с AI-рекомендациями

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase)](https://supabase.com/)
[![MUI](https://img.shields.io/badge/MUI-5-007FFF?logo=mui)](https://mui.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## Возможности

**Редактор резюме**
- Удобный редактор с табами и предпросмотром в реальном времени
- 5 встроенных шаблонов: Academic, Classic, GitHub, Minimalist, Modern
- Автосохранение с отслеживанием изменений через fingerprint
- Чеклист онбординга для быстрого старта

**Умные рекомендации**
- Health Check — оценка полноты резюме по всем разделам
- AI-рекомендации по улучшению резюме
- Job Match — анализ соответствия резюме описанию вакансии
- Генерация сопроводительного письма с проверками

**Интеграция с GitHub**
- Импорт репозиториев напрямую из вашего GitHub-профиля
- Автоподтягивание описаний, языков и тем
- Отображение до 5 избранных проектов

**Экспорт**
- PDF с точной визуализацией
- DOCX для ATS-совместимых систем
- Markdown для быстрого шаринга

**Авторизация и дашборд**
- Email/пароль аутентификация через Supabase
- Управление несколькими резюме из одного дашборда
- Восстановление и смена пароля

**Тема**
- Светлая и тёмная темы

---

## Стек технологий

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, Vite 5, React Router 6 |
| UI | Material UI 5, Framer Motion |
| Backend | Supabase (Auth, Postgres, Storage, Edge Functions) |
| PDF | @react-pdf/renderer |
| DOCX | docx.js |
| Тестирование | Vitest, Testing Library |
| Линтинг | ESLint |

---

## Быстрый старт

### Требования

- Node.js >= 18
- Проект [Supabase](https://supabase.com/)

### Установка

```bash
# Клонируем репозиторий
git clone https://github.com/painmoney/diplome-cv-builder.git
cd diplome-cv-builder

# Устанавливаем зависимости
npm install
```

### Настройка окружения

Создайте `.env.development.local` с вашими Supabase-данными:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Разработка

```bash
npm run dev          # Запуск dev-сервера (primary)
npm run dev:staging  # Запуск с staging-конфигурацией
```

### Сборка

```bash
npm run build
npm run preview
```

### Безопасный архив для отправки

Не архивируйте рабочую папку целиком: в ней могут быть `.env*`, `.git`, `node_modules`,
`dist` и локальное состояние Supabase. Для передачи проекта используйте безопасную упаковку:

```bash
npm run package:safe
```

### Тестирование

```bash
npm run test
npm run lint
```

---

## Структура проекта

```
src/
├── api/              # Supabase клиент, GitHub API, сервис резюме
├── components/
│   ├── ResumeBuilder/ # Редактор, блоки, health check, job match
│   ├── export/        # Экспорт в PDF, DOCX, Markdown
│   ├── templates/     # Визуальные компоненты шаблонов
│   ├── profile/       # Форма профиля
│   └── layout/        # Хедер, футер, обёртка лейаута
├── context/          # Контексты авторизации и темы
├── hooks/            # Пользовательские React хуки
├── pages/            # Страницы маршрутов (Home, Dashboard, Login и др.)
├── templates/        # JSON-конфиги шаблонов
├── utils/            # Утилиты, валидаторы, job match, рекомендации
└── styles.css        # Глобальные стили
```

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер (primary) |
| `npm run dev:staging` | Dev-сервер (staging) |
| `npm run build` | Продакшн-сборка |
| `npm run test` | Запуск тестов |
| `npm run lint` | Проверка ESLint |
| `npm run env:check` | Проверка окружения для primary |
| `npm run safety:scan` | Сканирование опасных Supabase-команд |
| `npm run backup:trigger-and-sync` | Триггер и синхронизация бэкапа БД |
