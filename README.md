# CV Builder

Веб-приложение для создания резюме специалистов в IT-сфере.

## Возможности

- **Редактор резюме** — 5 вкладок: профиль, навыки, образование, опыт работы, GitHub-проекты
- **3 шаблона** — Minimalist, Academic, GitHub-стиль; переключаются в реальном времени
- **Рекомендации** — движок проверяет резюме по 20+ критериям и подсказывает, что улучшить
- **Экспорт** — PDF, DOCX, Markdown, PNG, JPG
- **GitHub интеграция** — импорт репозиториев по username через GitHub REST API
- **Автосохранение** — debounce 1 секунда, индикатор статуса
- **Авторизация** — email/пароль через Supabase Auth, восстановление пароля
- **Аватар** — загрузка с кроппером, хранение в Supabase Storage
- **Тёмная/светлая тема** — переключение с сохранением в localStorage
- **Адаптивная вёрстка** — Material UI Grid, корректно на мобильных и десктопе

## Стек

| Слой | Технологии |
|---|---|
| Frontend | React 18, Vite 5, Material UI 5, Framer Motion |
| Бэкенд | Supabase (Auth, PostgreSQL, Storage, Edge Functions) |
| Экспорт PDF | @react-pdf/renderer |
| Экспорт DOCX | docx.js |
| Экспорт изображений | html2canvas |
| Экспорт Markdown | file-saver |
| GitHub API | REST API (unauthenticated) + Supabase Edge Function |
| Тестирование | k6 (нагрузочные тесты) |

## Структура проекта

```
src/
├── api/            # Supabase-клиент, сервис резюме, хранилище файлов, GitHub API
├── components/
│   ├── export/     # Экспорт в PDF/DOCX/Markdown + PDF-шаблоны
│   ├── layout/     # Header, Footer, LayoutWrapper, SplashScreen
│   ├── profile/    # ProfileForm, AvatarUpload
│   ├── ResumeBuilder/  # ResumeEditor, блоки данных, RecommendationPanel
│   └── templates/  # 3 визуальных шаблона резюме
├── context/        # AuthContext, ThemeModeContext
├── pages/          # Home, Login, Register, ForgotPassword, UpdatePassword, Dashboard, ResumePreview
├── templates/      # JSON-файлы с demo-данными шаблонов
├── utils/          # Хелперы, логика рекомендаций, валидация
└── styles.css
supabase/
└── functions/      # Edge Function для GitHub API (Deno)
load-tests/         # k6-тесты фронтенда и Supabase
```

## Запуск

```bash
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`.

### Сборка

```bash
npm run build
npm run preview
```

## Переменные окружения

Файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase Anon Key — публичный по дизайну. Безопасность данных обеспечивается Row Level Security (RLS) на стороне базы данных.

## Основные сценарии

1. **Регистрация** → подтверждение email → вход
2. **Заполнение резюме** — профиль, навыки, образование, опыт, GitHub-проекты
3. **Рекомендации** — панель подсказок с приоритизацией и ссылками на конкретные поля
4. **Переключение шаблонов** — в редакторе или в превью
5. **Экспорт** — скачивание PDF/DOCX/Markdown/PNG/JPG
6. **Восстановление пароля** — ссылка на /forgot-password → письмо → /update-password

## Статус проекта

Выпускная квалификационная работа на тему «Разработка веб-приложения для создания резюме специалистов в IT-сфере».

Реализовано: авторизация, CRUD-операции с резюме, 3 шаблона, экспорт в 5 форматов, GitHub-интеграция, система рекомендаций, автосохранение, адаптивная вёрстка, тёмная тема, нагрузочные тесты.
