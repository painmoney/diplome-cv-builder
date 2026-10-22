# Архитектура и функциональность

## Слои

Фактический frontend написан на JavaScript/JSX, а не TypeScript: React 18, Vite 5, MUI 5, React Router 6. TypeScript используется в Supabase Edge Function. Собственного REST-сервера нет: браузер обращается к Supabase Auth, PostgREST, Storage и `github-repos`.

`App.jsx` объединяет тему, AuthProvider, BrowserRouter и Sentry ErrorBoundary. Маршруты лениво загружаются из `routes.jsx`. `AuthContext` восстанавливает сессию через `getSession`, подписывается на `onAuthStateChange`; SDK хранит/обновляет сессию. `ProtectedRoute` проверяет наличие user после загрузки. Это защита навигации; доступ к данным обеспечивает RLS.

`resumeService.js` преобразует модели, вызывает RPC создания/сохранения и REST для чтения/удаления. `ResumeEditor` управляет вкладками, валидацией, предпросмотром и автосохранением; `saveQueueController.js` сериализует сохранения. Экспорт и шаблоны реализованы отдельными модулями/реестрами.

## Маршруты

| URL | Доступ | Сценарий |
| --- | --- | --- |
| `/` | публичный | описание приложения, шаблоны, начало регистрации |
| `/register` | публичный | email signup; кнопки Google/GitHub OAuth |
| `/login` | публичный | email/password, OAuth |
| `/forgot-password` | публичный | отправка письма восстановления |
| `/update-password` | страница публичная, операция требует recovery/session | новый пароль через Auth |
| `/privacy` | публичный | политика конфиденциальности |
| `/dashboard` | сессия | список, создание, переименование, копирование, удаление |
| `/resume-editor/:resumeId` | сессия и RLS | редактирование конкретного UUID |
| `/resume-preview/:resumeId` | сессия и RLS | предпросмотр, оформление, экспорт |
| любой неизвестный путь | публичный | NotFoundPage |

Публичного шаринга чужого резюме по UUID нет: preview тоже защищён.

## Реализация и зависимости

«Реализовано» ниже означает наличие связанного кода UI/API, а не результат полного ручного прогона. Текущее подтверждение запуска приведено в README этого раздела.

| Модуль | Действия в коде | Что требуется для доступности |
| --- | --- | --- |
| Аккаунт | signup, login, logout, reset/update password, восстановление сессии | Auth, почта, redirect URLs; email включён на staging |
| OAuth | Google и GitHub | на живом staging провайдеры отключены; кнопки отображаются, вход недоступен |
| Dashboard | несколько резюме, create/list/rename/duplicate/delete | актуальная схема, RPC, RLS; сквозной запуск ещё не подтверждён |
| Профиль | имя, контакты, «о себе», возраст, ссылки, фото, форма аватара | avatar_shape применён и проверен в staging |
| Разделы | навыки/уровни, опыт, образование, ручные проекты, GitHub-проекты; редактирование и порядок | RPC синхронизируют JSON и дочерние таблицы |
| Сохранение | ручное и автоматическое, индикатор ошибок, конфликт версий | RPC и profile upsert; общий атомарный commit для этих двух запросов отсутствует |
| Шаблоны | minimalist, academic, github, classic, modern; предпросмотр, уровни навыков | локальные реестры preview/PDF/DOCX |
| Health Check/рекомендации | оценка полноты и правил качества | локальная логика, сервер AI не требуется |
| Job Match | локальное сопоставление вакансии, evidence score | `jobMatchUtils.js`; отдельные AI-советы зависят от Puter |
| AI | «о себе», улучшение опыта, советы под вакансию, письмо | lazy SDK `https://js.puter.com/v2/`, согласие, авторизация/лимиты Puter; доступность не подтверждена |
| GitHub import | получить публичные репозитории username, выбрать до 5 | Edge Function, валидная сессия, серверный GITHUB_TOKEN; состояние токена не подтверждено |
| Экспорт | PDF, DOCX, Markdown, PNG/JPG | браузерные библиотеки; PDF подготавливает изображение, может экспортировать без фото при ошибке |
| Тема | светлая/тёмная | локальный контекст |
| Наблюдаемость | Sentry, ErrorBoundary | отправка событий только при VITE_SENTRY_DSN; для QA можно не задавать |

AI SDK загружается по действию; ошибки авторизации/лимитов преобразуются в сообщения, часть генераторов имеет безопасные fallback-тексты. Наличие fallback не подтверждает реальный вызов AI. GitHub handler возвращает контролируемые ошибки при отсутствии/истечении токена. Основной CRUD не должен требовать этих интеграций; это нужно проверить вручную после выравнивания схемы.

## Данные и связи

Источник итогового контракта: миграции в лексикографическом порядке, особенно `20260625000000_restore_canonical_backend.sql`, затем Storage и avatar shape. `supabase/schema.sql` пуст и не является способом установки схемы.

| Таблица | Основные поля и связи |
| --- | --- |
| `auth.users` | пользователь Supabase Auth |
| `resumes` | UUID PK, `user_id` NOT NULL → auth.users(id) CASCADE; title, template, data JSONB, revision NOT NULL default 1, created_at, updated_at; user_id не уникален |
| `profiles` | user_id PK; full_name, avatar_url, email, phone, about, timestamps; avatar_shape round/square добавляется последней миграцией. В канонической миграции FK к auth.users не задан |
| `skills` | bigserial PK, resume_id NOT NULL FK CASCADE; skill_name, level smallint |
| `education` | bigserial PK, resume_id FK CASCADE; institution, institute, department, program, degree, years |
| `experience` | bigserial PK, resume_id FK CASCADE; company, position, period, description |
| `github_projects` | bigserial PK, resume_id FK CASCADE; project_name, project_url, description, stars |
| `manual_projects` | UUID PK, resume_id FK CASCADE; name, role, description, tech_stack, link, period, position>=0, source_id; unique(resume_id, position), частичный unique(resume_id, source_id) |

`resumes.data` — полный документ редактора. Дочерние таблицы содержат нормализованную проекцию. RPC удаляет и создаёт дочерние строки заново внутри транзакции, поэтому их ID не стабильны. Поля вроде age, location, ссылок профиля остаются в JSON. Профиль аккаунта сохраняется отдельно и подставляется при создании следующего резюме.

В SQL RLS включён на семи public-таблицах. Для resumes/profiles политики сравнивают user_id с `auth.uid()`, для дочерних — проверяют владельца через resumes. UPDATE имеет USING и WITH CHECK. anon лишён прав на таблицы/RPC; authenticated имеет CRUD, но на manual_projects — SELECT/INSERT/DELETE без прямого UPDATE. Обе RPC — SECURITY INVOKER с пустым search_path, EXECUTE только authenticated. Эффективные политики живой БД ещё нужно сверить: permissive policies складываются через OR.

`avatars` по проектному контракту публичный: читать изображение по известному URL может любой, запись/изменение/удаление разрешены только в папке своего `auth.uid()`. Это не приватное хранилище. Использовать только синтетические картинки. Смена фото создаёт новый timestamp-файл; автоматическая очистка старых файлов в `storage.js` не реализована.

## Автосохранение и версии

После загрузки hydration gate и fingerprint предотвращают немедленную обратную запись. Изменения дебаунсятся на 1000 мс. Очередь допускает один запрос в полёте и заменяет ожидающий snapshot более новым. `save_resume_full` сравнивает `p_expected_revision` с БД и атомарно увеличивает revision. Конфликт P1005 останавливает очередь и предлагает обновить страницу; автоматического слияния нет. Истории версий/восстановления старой редакции нет: revision — счётчик конкурентного доступа.

Create с тем же UUID своего резюме идемпотентен: возвращает существующие метаданные без перезаписи. После RPC выполняется отдельный profile upsert. Если он неудачен, интерфейс сообщает, что резюме сохранено, но профиль не синхронизирован. При сетевой ошибке не запускается бесконечный retry; проверить повторное ручное сохранение и потерю несохранённых изменений при закрытии вкладки.
