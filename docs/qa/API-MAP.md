# Карта API для ручной работы

База `S = https://jerwfvhpoanoukxiyvwq.supabase.co`. Все операции предназначены только для staging. Заголовок `apikey: <publishable или anon key staging>` нужен Supabase API. Для защищённых запросов дополнительно `Authorization: Bearer <access_token пользователя>`. Publishable key не является пользовательским JWT; не подставлять его как Bearer. JSON-запросы: `Content-Type: application/json`.

## Auth

| Метод / endpoint | Назначение и параметры | Авторизация | Ответ / данные |
| --- | --- | --- | --- |
| POST `/auth/v1/signup?redirect_to=<origin/>` | `{email,password}`; Register задаёт emailRedirectTo=window.location.origin | apikey | user и session либо session=null при подтверждении; auth.users/identities |
| POST `/auth/v1/token?grant_type=password` | `{email,password}` | apikey | access_token, refresh_token, expires_in, user |
| POST `/auth/v1/token?grant_type=refresh_token` | `{refresh_token}` | apikey | обновлённая session; сохранить также новый refresh_token |
| POST `/auth/v1/logout` | выход; SDK по умолчанию использует scope global | apikey + JWT | пустой ответ; access JWT может оставаться валидным до истечения, refresh сессии отозван |
| POST `/auth/v1/recover?redirect_to=<origin/update-password>` | `{email}`; resetPasswordForEmail | apikey | подтверждение принятия запроса; письмо/recovery-ссылка, не пароль |
| PUT `/auth/v1/user` | `{password}`; updateUser | apikey + JWT recovery/активной сессии | user |
| GET `/auth/v1/authorize?provider=google&redirect_to=...` | OAuth redirect; аналогично provider=github | поток браузера, настройки provider | переход на провайдера и callback; на текущем staging отключено |
| GET `/auth/v1/user` | используется Edge Function через getUser(jwt) | apikey + JWT | подтверждённый user либо ошибка |

`getSession()` и `onAuthStateChange()` — методы SDK работы с локальным состоянием; это не отдельные прикладные REST endpoints. При необходимости SDK вызывает refresh endpoint. `getUser()` в Edge Function проверяет токен на сервере.

## Резюме и профиль: вызовы из клиента

| Метод / endpoint | Назначение, основные параметры | Авторизация | Ожидаемый ответ | Таблицы |
| --- | --- | --- | --- | --- |
| GET `/rest/v1/profiles?user_id=eq.<uid>&select=full_name,avatar_url,avatar_shape,email,phone,about` | начальный профиль для нового резюме, maybeSingle | apikey + JWT | объект/нет строки; SDK маскирует ошибку как null | profiles |
| GET `/rest/v1/profiles?user_id=eq.<uid>&select=*` | getProfile helper, single | apikey + JWT | объект или ошибка отсутствия/множественности | profiles |
| POST `/rest/v1/profiles?on_conflict=user_id` | upsert; user_id, full_name, avatar_url, avatar_shape, email, phone, about, updated_at; `Prefer: resolution=merge-duplicates` | apikey + JWT | обычно 201/204 без тела, если не запрошен representation | profiles |
| GET `/rest/v1/resumes?user_id=eq.<uid>&select=id,title,template,revision,created_at,updated_at&order=updated_at.desc,id.asc` | список пользователя | apikey + JWT | массив метаданных | resumes |
| GET `/rest/v1/resumes?id=eq.<uuid>&select=*` | загрузка документа, maybeSingle | apikey + JWT | объект/нет строки; в Postman с обычным Accept — массив | resumes |
| POST `/rest/v1/rpc/create_resume_full` | создание, копирование; p_resume_id UUID, p_title text, p_template text, p_data JSON object | apikey + JWT | массив из одной строки out_resume_id, out_revision, out_updated_at | resumes + 5 дочерних таблиц |
| POST `/rest/v1/rpc/save_resume_full` | сохранение/rename; те же поля + p_expected_revision integer | apikey + JWT | те же метаданные, новая revision | resumes + 5 дочерних таблиц |
| DELETE `/rest/v1/resumes?id=eq.<uuid>&select=id` | удалить своё резюме; `Prefer: return=representation` | apikey + JWT | строка id в SDK maybeSingle / массив в обычном REST; при чужом ID нет строки | resumes; FK CASCADE skills/education/experience/github_projects/manual_projects |

Переименование: клиент загружает документ и вызывает save RPC с новым title и считанной revision. Копирование: загрузка source и create RPC с новым UUID и title. Отдельных endpoints `/rename` и `/duplicate` нет. `saveProfile` выполняется очередью после RPC отдельным запросом, не внутри RPC.

### JSON-контракт RPC

```json
{
  "p_resume_id": "11111111-1111-4111-8111-111111111111",
  "p_title": "QA-A — Frontend Demo",
  "p_template": "minimalist",
  "p_data": {
    "profile": {"name":"Алексей Тестовый","email":"qa-a@example.test","about":"Синтетическое резюме для QA","avatarShape":"round"},
    "skills": [{"name":"React","level":3}],
    "education": [{"institution":"Учебный университет","degree":"Бакалавр","years":"2020–2024"}],
    "experience": [{"company":"Example QA Lab","position":"Frontend developer","period":"2024–2025","description":"Создавал демонстрационные интерфейсы"}],
    "github": [],
    "projects": [{"id":"qa-project-a","name":"Demo task board","role":"Developer","techStack":"React","link":"https://example.test/task-board","period":"2025","description":"Учебный проект"}],
    "template":"minimalist",
    "showSkillLevels":true
  }
}
```

UUID в примере — только форма. Для реального create сгенерировать новый UUID и сохранить в локальной переменной. Для save добавить `p_expected_revision` из последнего ответа. Удаление элементов: передать соответствующий массив `[]`. Поле p_data содержит полный снимок, а не patch. Сервер ставит template по p_template; не полагаться на расходящиеся значения.

`skills` принимает строки или объекты name/level. SQL отбрасывает пустые имена, числовой level округляет и ограничивает 1–5. Education синхронизируется при непустом institution, experience — company, github — name; manual_projects берёт объекты массива и position из порядка. Это важно при сравнении JSON и таблиц: их количество не всегда равно при неполных элементах.

Ошибки PostgREST/RPC приходят объектом `{code,message,details,hint}`. По SQL: P1001 AUTHENTICATION_REQUIRED, P1002 INVALID_RESUME_PAYLOAD, P1004 RESUME_NOT_FOUND_OR_FORBIDDEN, P1005 REVISION_CONFLICT. Не считать все эти ошибки HTTP 409: использовать code и фактический HTTP. До вызова функции anon может получить permission denied (42501/401), а не P1001. P1003 оставлен в обработчике старых ошибок клиента, но текущий multi-resume RPC его не использует. Ограничения SQL могут вернуть и другие коды (unique/check/cast).

### Дополнительный REST для инспекции в Postman

Дочерние таблицы доступны через `/rest/v1/{skills|education|experience|github_projects|manual_projects}?resume_id=eq.<uuid>&select=*` (GET, apikey+JWT, массив). Приложение загружает полный документ из resumes.data, а не из этих таблиц. Для проверки RLS можно вручную отправлять INSERT/PATCH/DELETE к известным синтетическим строкам: права зависят от grants и policies; manual_projects не имеет прямого UPDATE grant. Прямая запись в resumes через REST не запускает нормализацию RPC и может рассинхронизировать проекции; использовать отдельный disposable-документ и не включать такой путь в основной CRUD.

## Storage и Edge Function

| Метод / endpoint | Назначение / параметры | Авторизация | Ответ / таблицы |
| --- | --- | --- | --- |
| POST `/storage/v1/object/avatars/<userId>/avatar-<timestamp>.webp` | бинарный file; Content-Type image/webp, x-upsert false, cache-control 31536000 | apikey + JWT владельца папки | объект пути; storage.objects |
| GET `/storage/v1/object/public/avatars/<userId>/<file>` | публичное изображение; getPublicUrl только строит URL и не делает запрос | не нужна | бинарное изображение, public bucket |
| POST `/functions/v1/github-repos` | `{username}`; server trim/@ normalization, валидация, GitHub GET users/{username}/repos?sort=updated&per_page=50 | apikey + пользовательский JWT, handler getUser | массив `{name,description,url,stars,language,forks}`; запись в БД этим запросом не выполняется |
| OPTIONS `/functions/v1/github-repos` | CORS preflight | не нужна | ok с CORS headers |

Storage UPDATE/DELETE policies существуют в SQL, но текущий storage.js вызывает только upload/getPublicUrl. Для ручной проверки записи в чужую папку и удаления использовать отдельные синтетические объекты. Публичное чтение аватаров B пользователем A разрешено контрактом; запись в папку B должна быть запрещена.

Edge Function: 401 без валидного пользователя; 400 неверный username; 404 GitHub user missing; 429 rate limit; 503 token missing/expired; 502 token rejected/upstream error; 405 для другого метода. Без серверного токена авторизованный запрос должен сообщить недоступность, а не выдать фиктивные репозитории.

## Внешние вызовы без собственного REST-контракта

AI: `window.puter.ai.chat(prompt, {model,...})` после загрузки Puter SDK. Это клиентская интеграция, стабильного собственного `/api/ai` нет; не придумывать endpoint для Postman. Health Check, локальные рекомендации, основной Job Match и экспорт PDF/DOCX/Markdown/PNG/JPG выполняются в браузере. Sentry отправляет события только при DSN. Загрузка фото/шрифтов при экспорте может требовать сеть/CORS.

## Как пользоваться коллекцией

Все значения подставляются вручную из локального environment. После login вручную перенести access_token, refresh_token, user.id; после create/save — out_resume_id/out_revision. Коллекция не содержит pre-request scripts, tests, секретов и автоматического выполнения. Не запускать Runner. Отправлять запросы по одному, сохранять фактические наблюдения самостоятельно. Для signup/recovery указать корректный qa_origin без завершающего `/`, разрешённый в staging Auth.
