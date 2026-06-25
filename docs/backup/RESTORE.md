# Restore Guide — CV Builder Primary Backup

> **Важно:** Это руководство описывает процесс восстановления backup.
> Restore **не выполняется автоматически**. Тarget ref должен проверяться отдельно.
> Восстановление в primary требует ручного approval.

## Предварительные проверки

1. **Проверка SHA-256:**
   ```bash
   sha256sum -c cv-builder-primary-*.tar.gz.enc.sha256
   ```

2. **Расшифровка:**
   ```bash
   openssl enc \
     -aes-256-cbc \
     -d \
     -pbkdf2 \
     -iter 600000 \
     -in cv-builder-primary-*.tar.gz.enc \
     -out backup.tar.gz \
     -pass env:BACKUP_ENCRYPTION_PASSPHRASE
   ```

3. **Распаковка:**
   ```bash
   mkdir -p restore-work
   tar -xzf backup.tar.gz -C restore-work
   cd restore-work
   ```

4. **Проверка checksums:**
   ```bash
   sha256sum -c checksums.sha256
   ```

## 1. Восстановление Roles

```bash
psql "$DATABASE_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f database/roles.sql
```

## 2. Восстановление Public Schema

```bash
psql "$DATABASE_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f database/public_schema.sql
```

## 3. Восстановление Public Data

```bash
psql "$DATABASE_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f database/public_data.sql
```

## 4. Восстановление Migration History Schema

```bash
psql "$DATABASE_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f database/migration_history_schema.sql
```

## 5. Восстановление Migration History Data

```bash
psql "$DATABASE_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f database/migration_history_data.sql
```

## 6. Восстановление Auth Schema

```bash
psql "$DATABASE_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f database/auth_schema.sql
```

## 7. Восстановление Auth Data

```bash
psql "$DATABASE_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f database/auth_data.sql
```

> **Примечание:** Восстановление Auth data включает хешированные пароли.
> Старые JWT могут стать недействительными при другом JWT secret.

## 8. Восстановление Storage Schema

```bash
psql "$DATABASE_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f database/storage_schema.sql
```

## 9. Восстановление Storage Data

```bash
psql "$DATABASE_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f database/storage_data.sql
```

> **Важно:** Storage metadata без файлов недостаточно.

## 10. Повторная загрузка Storage Files

Используйте `storage/objects-manifest.json` для загрузки файлов:

```bash
node -e "
  const manifest = require('./storage/objects-manifest.json');
  for (const obj of manifest.objects) {
    console.log('Upload:', obj.bucket + '/' + obj.name, '(' + obj.size + ' bytes)');
    // Используйте Supabase Storage API для загрузки каждого файла
  }
"
```

Каждый файл сохраняется в `storage/files/<bucket>/<path>`.

## 11. Deploy Edge Functions

Edge Functions развертываются из tracked source:

```bash
cd project
supabase functions deploy --project-ref <target-ref>
```

Source code находится в `project/supabase/functions/`.

## 12. Ручное возвращение Secret Values

Список необходимых secrets см. в `metadata/required-secret-names.json`.

Значения secret'ов **не входят в backup** и должны быть вставлены вручную:

- `SUPABASE_JWT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (если изменился)
- `ANON_KEY` (если изменился)
- Другие project-specific secrets

## 13. Integration Tests

После восстановления выполните все тесты:

```bash
npm test
```

## 14. Browser Smoke Test

Проверьте основные функции в браузере:

- Авторизация пользователей
- Создание/редактирование резюме
- Загрузка аватаров
- Export в PDF

## 15. Cleanup

```bash
rm -rf restore-work
rm -f backup.tar.gz
unset BACKUP_ENCRYPTION_PASSPHRASE
```

## Важные замечания

- **Restore не выполняется автоматически** — только по ручной команде.
- **Target ref должен проверяться отдельно** перед восстановлением.
- **Восстановление в primary требует ручного approval** от ответственного лица.
- **Storage metadata без файлов недостаточно** — файлы необходимо загрузить отдельно.
- **Старые JWT могут стать недействительными** при другом JWT secret.
- **Backup считается полностью доказанным** только после отдельного restore drill.
