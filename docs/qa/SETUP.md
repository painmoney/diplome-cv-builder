# Запуск и развёртывание QA

## Блокирующие факторы

1. Нет подтверждённого подключения Vercel: опубликованный URL не создан. Нужен доступ к отдельному QA-проекту Vercel или ручной import репозитория.
2. Нет подтверждённого SQL/Management-доступа к staging и миграционной истории. Публичный ключ и локальный серверный ключ позволили только прочитать API-схему/настройки Storage. Они не заменяют пароль PostgreSQL или авторизацию Supabase CLI.
3. В живом `profiles` отсутствует `avatar_shape`: frontend уже использует его. До полного CRUD требуется сверить историю и применить существующую миграцию.
4. Для сквозной проверки нужны два отдельных подтверждённых тестовых пользователя. Аккаунты в рамках подготовки не создавались. Signup с подтверждением и recovery зависят от доставки писем.

OAuth, GitHub token и Puter — дополнительные зависимости соответствующих функций. Их отсутствие не причина отключать RLS или менять основной CRUD.

## Локальный frontend

Использовать Node.js 22 (не ниже 22.13 для текущих инструментов) и npm. Зафиксированный `package-lock.json` сохраняется.

```powershell
git clone https://github.com/painmoney/diplome-cv-builder.git
cd diplome-cv-builder
git switch chore/qa-staging-setup
npm ci
Copy-Item .env.staging.example .env.staging.local
```

В `.env.staging.local` заменить только placeholder ключа на **publishable** или legacy **anon** key проекта `jerwfvhpoanoukxiyvwq`. Серверные ключи сюда не помещать. Если файл уже заполнен, не перезаписывать его шаблоном. В подготовленной локальной копии публичные staging-настройки уже заполнены из существующего проекта; в ZIP/PR реальные значения ключей не входят.

```powershell
npm run staging:guard
npm run env:check:staging
npm run dev:staging
```

Открыть `http://127.0.0.1:5199`. `http://localhost:5199` можно использовать как отдельный origin, если он разрешён в Auth. При занятом порте команда завершится: освободить порт, а не менять URL незаметно. Для просмотра собранной версии: `npm run build:staging`, затем `npm run preview -- --host 127.0.0.1 --port 5199 --strictPort` после остановки dev-сервера.

Не использовать `npm run dev`: это команда **primary**. Для QA всегда выбирать staging-команды. Проверка окружения использует приоритет Vite: process.env выше mode local, mode, `.env.local`, `.env`. Заданные в терминале неверные переменные могут перекрывать файл; guard остановит запуск.

## Проверка и миграции Supabase

Использовать уже существующий staging, новый проект не требуется. Его URL: `https://jerwfvhpoanoukxiyvwq.supabase.co`. Primary из реестра заканчивается на `oskr`; никакие тестовые операции к нему не направлять. Локальная исходная папка `C:\cv-builder-diplome` связана с **primary**; её link нельзя копировать в QA.

Сначала в Dashboard выбрать именно staging и выполнить read-only запросы из `staging-inspection.sql`. Получить историю миграций, RLS, grants, FK, bucket и фактические определения RPC. Каталог, прочитанный как postgres/owner, не проверяет поведение RLS клиента: его проверяют отдельно с JWT A/B.

Порядок 15 миграций:

| Версия | Назначение / риск |
| --- | --- |
| 00000000000000 | базовые таблицы и временный unique user_id |
| 20260621000000 | RLS, policies, grants |
| 20260621120000 | NOT NULL, индексы, revision; preconditions на NULL/сирот |
| 20260621130000 | атомарные create/save RPC |
| 20260621140000 | идемпотентность создания |
| 20260623235512 | несколько резюме: удаление unique index user_id после проверок |
| 20260624004059 | замена create RPC, удаление старого ограничения P1003 |
| 20260624070715 | manual_projects, FK и ограничения |
| 20260624072139 | синхронизация ручных проектов в RPC |
| 20260624073936 | исправление grants |
| 20260624074254 | исправление RPC с WITH ORDINALITY |
| 20260624082752 | **DELETE всех manual_projects и восстановление из resumes.data**; потенциальная потеря расхождений |
| 20260625000000 | канонические таблицы, ограничения, RLS, RPC, catalog assertions; пересоздаёт именованные policies/grants |
| 20260710190000 | upsert публичного avatars, MIME/лимит, замена четырёх Storage policies |
| 20260807000000 | avatar_shape NOT NULL default round и CHECK round/square |

Не применять весь набор повторно через SQL Editor. При существующей БД сначала сопоставить history и объекты. Backfill содержит реальное массовое удаление, в отличие от DELETE внутри определений RPC, которые выполняются только при вызове функции. Storage-миграция меняет публичность/настройки bucket; заранее сверить её с нужным контрактом. NOT NULL/FK/CHECK могут остановиться на несогласованных данных. При дрейфе остановиться и разобрать причину, не использовать reset/repair и не отключать RLS.

Существующий remote wrapper требует чистую синхронизированную `production-development` и интерактивное подтверждение полного staging ref. Чтобы не снимать защиту и не переключать рабочую QA-ветку, для миграций использовать отдельную чистую копию текущей основной ветки:

```powershell
git clone --branch production-development https://github.com/painmoney/diplome-cv-builder.git cv-builder-staging-db
cd cv-builder-staging-db
npm ci
npx supabase login
npx supabase link --project-ref jerwfvhpoanoukxiyvwq
npm run db:staging:status
npm run db:staging:migrations
npm run db:staging:dry-run
```

Пароль БД вводить в защищённом интерактивном prompt, не в командной строке и не в Git. Если dry-run предлагает только ожидаемые недостающие миграции, схема и история понятны, а необходимые синтетические данные сохранены, выполнить `npm run db:staging:push` и ввести staging ref. При неожиданном backfill или большом списке отложить push до проверки. После применения вновь выполнить read-only inspection. Требуется наличие `profiles.avatar_shape`, двух RPC и всех RLS/policies; номер последней миграции сам по себе недостаточен.

## Auth и дополнительные сервисы

В **staging** Dashboard → Authentication → URL Configuration задать Site URL точного QA-домена. В Redirect URLs добавить точные пути этого домена: `/`, `/dashboard`, `/update-password`, а также локальные `http://127.0.0.1:5199/`, `/dashboard`, `/update-password` и при необходимости аналогичные localhost. Эти адреса берутся из `Register`, `Login`, `ForgotPassword`; произвольный wildcard всех vercel.app не нужен. Для стабильного recovery использовать постоянный QA-домен.

Email provider включён, подтверждение email требуется. Для signup и recovery нужен доступный тестовый почтовый ящик и работающая доставка/SMTP. Для заранее подготовленных A/B можно создать пользователей через staging Dashboard → Users с подтверждённым email; это не проверяет реальный signup-поток. Не выключать подтверждение глобально ради smoke-проверки. Google/GitHub OAuth можно настроить отдельно, только для staging, с callback `https://jerwfvhpoanoukxiyvwq.supabase.co/auth/v1/callback` в панели провайдера.

`github-repos`: по текущему `config.toml` gateway `verify_jwt=false`, но handler **обязательно** проверяет Bearer token через Supabase Auth `getUser(jwt)`. Это существующая архитектура, а не отсутствие авторизации. Старое описание `verify_jwt=true` устарело. Разворачивать текущую функцию только на staging: `npx supabase functions deploy github-repos --project-ref jerwfvhpoanoukxiyvwq`. GITHUB_TOKEN и необязательный GITHUB_TOKEN_EXPIRES_AT задавать только в staging Edge Function Secrets; не в Vercel `VITE_`. Актуальность token не подтверждена.

AI использует Puter в браузере и отдельную авторизацию/лимиты. Включать передачу только синтетических данных через существующий диалог согласия. При отсутствии AI проверить обработку ошибки; локальные Health Check/Job Match имеют отдельную реализацию.

## Vercel

Создать отдельный проект `cv-builder-qa`, импортировать тот же GitHub-репозиторий и выбрать ветку `chore/qa-staging-setup`. Root directory — корень репозитория; Framework Preset — Vite; Node — 22.x; Install Command — `npm ci`; Build Command — **`npm run build:staging`**; Output Directory — `dist`. Существующий `vercel.json` уже содержит SPA rewrite для прямых URL. Не менять настройки существующего production-проекта.

В Environment Variables отдельного QA-проекта задать только `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` из staging. Выбрать нужный scope Preview, а при использовании Production scope **отдельного QA-проекта** — эти же staging-значения. Не переносить серверные секреты. После изменения env выполнить Redeploy.

Для CLI-развёртывания отдельного QA-проекта использовать `vercel --local-config vercel.staging.json`; альтернативный конфиг не подхватывается Git integration автоматически. При Git import все build-настройки из предыдущего абзаца задать в Dashboard; rewrite берётся из основного `vercel.json`.

После получения домена обновить staging Auth URLs и провести краткую техническую проверку: открыть приложение, signup/confirmation/login, создать резюме, изменить поле, дождаться сохранения, reload, удалить свой синтетический документ, открыть прямые editor/preview URL, проверить Console/Network. Затем проверить A/B с отдельными JWT. До этого не обозначать окружение готовым.

Справка: [Vite на Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Edge Function Auth](https://supabase.com/docs/guides/functions/auth).
