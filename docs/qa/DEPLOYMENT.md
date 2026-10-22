# QA deployment: техническая готовность

Проверено 22 октября 2026. Сайт: **https://cv-builder-qa.vercel.app**.

## Подтверждённое развёртывание

Отдельный Vercel project `cv-builder-qa` (`prj_r3ewBEJs4YqFh9sL1zJuF7sek6Bf`). GitHub: `painmoney/diplome-cv-builder`, Production Branch `chore/qa-staging-setup` подтверждена настройкой проекта. Vite, Node 22.x, install `npm ci`, build `npm run build:staging`, output `dist`. Существующий SPA rewrite сохранён.

Deployment `dpl_Hpmv2VhnqWaK5YGP96yMf8gzNbNh`, runtime commit `cc29dd2bb69170cd33aa0c0fbbcb053d038b1973`: READY, alias назначен без ошибки. Build logs подтверждают оба env guards PASS и успешный Vite build. Прямой editor URL загружается после reload. Vercel Authentication отключена только для нового QA-проекта с явного разрешения пользователя. В приложении продолжают действовать Supabase Auth и RLS.

В Vercel заданы только `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` staging; серверных Supabase/GitHub ключей в frontend нет. Автоматическое раскрытие VITE_* отключено, разрешены только три явных клиентских поля. Неизвестная контрольная переменная отсутствует в локальном build bundle.

## Supabase staging

Только `jerwfvhpoanoukxiyvwq`. 15 миграций; недостающие Storage policies и profiles.avatar_shape применены без reset. [Соответствие версий](APPLIED-MIGRATIONS.md). RLS включён на семи таблицах. Auth, resume RPC, ownership A/B и Storage проверены прямыми пользовательскими запросами — подробности в [README](README.md).

Пользователь сохранил в staging Site URL `https://cv-builder-qa.vercel.app` и Redirect URLs: этот origin, origin с `/`, `/dashboard`, `/update-password`. После этого административная генерация recovery-ссылок без отправки email подтвердила Site URL по умолчанию и сохранение каждого заданного redirect. Токены и ссылки с токенами не публиковались.

## Проверка размещённого интерфейса

Вход синтетическим пользователем A → Dashboard → создание disposable-резюме → изменение названия и «О себе» → «Сохранено» → reload прямого editor URL. Изменения и авторизованная сессия восстановились. Возврат в Dashboard → удаление этого disposable-документа; карточка исчезла, пользовательский запрос к БД вернул 0 строк для его ID.

Выход A привёл на `/login`. После входа B Dashboard показывал только документ B; прямой editor URL документа A показал «Резюме не найдено или у вас нет доступа к нему». Сессия B затем завершена через интерфейс. Список captured console warn/error в финальной проверке пуст.

Это техническая проверка стенда, а не Manual QA-прогон или результаты портфолио. Автотесты не добавлялись. Основные синтетические документы A/B оставлены; личные данные и пароли не входят в материалы.

## Оставшиеся ограничения

- Реальная доставка email и полный signup/recovery через почтовый ящик не проверены. Подтверждение email проверено через публичный Auth API с административно сгенерированными signup-токенами; это не доказательство доставки писем. Email confirmation в staging включён.
- GitHub import возвращает контролируемую 503 `GITHUB_TOKEN_NOT_CONFIGURED`; нужен серверный GitHub token в staging Function Secrets. Gateway verify_jwt=true сохранён; анонимный запрос возвращает 401.
- Google/GitHub OAuth в staging выключены. AI/Puter и экспорт файлов в эту техническую проверку не входили.
- Security advisor: leaked-password protection выключена. Существующие зависимости дают npm audit findings; автоматическое обновление зависимостей не выполнялось.

`production-development`, Supabase primary и существующие production-развёртывания не изменялись. Draft PR №1 не сливался. Порт 5199 остановлен по запросу пользователя.
