import { useEffect } from "react";
import { Container, Typography, Box, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const SECTION_STYLE = { mb: 4 };
const H2_STYLE = { fontWeight: 700, mb: 1 };
const P_STYLE = { mb: 1, lineHeight: 1.7, color: "text.primary" };
const SMALL_STYLE = { ...P_STYLE, color: "text.secondary", fontSize: "0.875rem" };
const UL_STYLE = { pl: 2.5, mb: 1, "& li": { mb: 0.5, lineHeight: 1.7 } };

const EFFECTIVE_DATE = "12 июля 2026 года";
const LAST_UPDATED_DATE = "12 июля 2026 года";

// Заполните только эти два значения своими реальными данными перед production-сборкой.
const SERVICE_OWNER = "Prokofiev Matvey Michkailovich";
const CONTACT_EMAIL = "cvprivacy@yandex.ru";

const TODO_HIGHLIGHT = {
  display: "inline",
  bgcolor: "warning.light",
  color: "warning.contrastText",
  px: 0.5,
  borderRadius: 0.5,
  fontWeight: 600,
  fontSize: "0.85em",
};

const getPlaceholderStyle = (value) =>
  typeof value === "string" && value.startsWith("TODO_")
    ? TODO_HIGHLIGHT
    : undefined;

function ExternalLink({ href, children }) {
  return (
    <MuiLink href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </MuiLink>
  );
}

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Политика конфиденциальности — CV Builder";
  }, []);

  const serviceUrl =
    typeof window !== "undefined" ? window.location.origin : "текущий адрес Сервиса";

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Политика конфиденциальности
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Дата вступления в силу: {EFFECTIVE_DATE}
      </Typography>

      {/* 1 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          1. Владелец сервиса
        </Typography>
        <Typography sx={P_STYLE}>
          Сервис «CV Builder» эксплуатируется{" "}
          <Box component="span" sx={getPlaceholderStyle(SERVICE_OWNER)}>
            {SERVICE_OWNER}
          </Box>
          .
        </Typography>
        <Typography sx={P_STYLE}>
          Контакт по вопросам конфиденциальности:{" "}
          <Box component="span" sx={getPlaceholderStyle(CONTACT_EMAIL)}>
            {CONTACT_EMAIL}
          </Box>
          .
        </Typography>
      </Box>

      {/* 2 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          2. Область действия
        </Typography>
        <Typography sx={P_STYLE}>
          Настоящая политика описывает, какие данные обрабатываются, для каких
          целей они используются, кому могут передаваться и какие права вы имеете
          при использовании CV Builder (далее — «Сервис»).
        </Typography>
        <Typography sx={P_STYLE}>
          Актуальный адрес Сервиса:{" "}
          <MuiLink href={serviceUrl}>{serviceUrl}</MuiLink>.
        </Typography>
        <Typography sx={P_STYLE}>
          Используя Сервис, вы подтверждаете, что ознакомились с настоящей
          политикой. Для операций, основанных на отдельном согласии, Сервис
          запрашивает его дополнительно.
        </Typography>
      </Box>

      {/* 3 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          3. Какие данные обрабатываются
        </Typography>
        <Typography sx={P_STYLE}>
          Мы обрабатываем данные, которые вы предоставляете при использовании
          Сервиса, сведения, полученные через подключённые интеграции, а также
          минимальный объём технических данных, необходимый для работы,
          безопасности и диагностики Сервиса.
        </Typography>
      </Box>

      {/* 4 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          4. Данные аккаунта
        </Typography>
        <Typography sx={P_STYLE}>
          При регистрации по email вы указываете адрес электронной почты и
          пароль. Аутентификация выполняется через Supabase Auth. Приложение не
          получает ваш пароль в открытом виде.
        </Typography>
        <Typography sx={P_STYLE}>
          При входе через Google или GitHub Supabase может получить от выбранного
          провайдера доступные в рамках выданных разрешений сведения, например
          email, имя, идентификатор профиля и аватар.
        </Typography>
      </Box>

      {/* 5 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          5. Содержимое резюме и аватар
        </Typography>
        <Typography sx={P_STYLE}>
          Вы можете создавать и редактировать резюме, содержащие следующие данные:
        </Typography>
        <Box component="ul" sx={UL_STYLE}>
          <li>
            ФИО, email, телефон, город, ссылки на профили GitHub, LinkedIn,
            Telegram, Habr Career и личный сайт
          </li>
          <li>раздел «О себе»</li>
          <li>
            сведения об образовании: учреждение, подразделение, направление,
            степень и годы обучения
          </li>
          <li>
            опыт работы: компания, должность, период и описание деятельности
          </li>
          <li>навыки и указанный пользователем уровень владения</li>
          <li>
            проекты из GitHub: название, описание, язык, звёзды, форки и ссылка
          </li>
          <li>
            проекты, добавленные вручную: название, роль, описание, технологии,
            ссылка и период
          </li>
        </Box>
        <Typography sx={P_STYLE}>
          Аватар преобразуется в WebP и кадрируется на стороне браузера. Размер
          исходного файла ограничен 5 МБ. Аватар хранится в публичном bucket
          Supabase Storage и может быть доступен по прямой ссылке.
        </Typography>
        <Typography sx={P_STYLE}>
          Данные резюме хранятся в Supabase и привязаны к вашему аккаунту. Доступ
          к строкам базы ограничен политиками Row Level Security.
        </Typography>
      </Box>

      {/* 6 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          6. GitHub-интеграция
        </Typography>
        <Typography sx={P_STYLE}>
          Для импорта проектов вы указываете имя пользователя GitHub. Сервис
          запрашивает через GitHub API сведения о публичных репозиториях.
        </Typography>
        <Typography sx={P_STYLE}>
          Запрос выполняется через Supabase Edge Function с серверным токеном
          приложения. Ваш личный токен GitHub для этого импорта не запрашивается
          и не сохраняется.
        </Typography>
        <Typography sx={P_STYLE}>
          Выбранные сведения о репозиториях сохраняются в составе вашего резюме.
        </Typography>
      </Box>

      {/* 7 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          7. AI-функции
        </Typography>
        <Typography sx={P_STYLE}>
          Сервис предоставляет AI-функции для генерации раздела «О себе»,
          улучшения описания опыта, подготовки сопроводительного письма и анализа
          соответствия вакансии.
        </Typography>
        <Typography sx={P_STYLE}>
          AI-запрос отправляется из браузера в Puter. Puter передаёт запрос
          поставщику выбранной модели. В текущей версии используется модель
          GPT-4o Mini компании OpenAI с идентификатором{" "}
          <code>openai/gpt-4o-mini</code>.
        </Typography>
        <Typography sx={P_STYLE}>
          В зависимости от выбранной функции могут передаваться введённые вами
          сведения из резюме, описание опыта, навыки, проекты и текст вакансии.
          Не включайте в AI-запрос данные, которые не хотите передавать внешнему
          поставщику.
        </Typography>
        <Typography sx={P_STYLE}>
          Перед первым AI-запросом Сервис показывает отдельное уведомление.
          AI-функции запускаются только по вашему действию. Сгенерированный ответ
          носит вспомогательный характер и требует проверки пользователем.
        </Typography>
      </Box>

      {/* 8 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          8. Технические данные и Sentry
        </Typography>
        <Typography sx={P_STYLE}>
          Если Sentry включён в production-конфигурации, при ошибке могут
          передаваться сообщение и стек ошибки, адрес страницы, версия браузера и
          операционной системы, а также другие технические сведения, необходимые
          для диагностики.
        </Typography>
        <Typography sx={P_STYLE}>
          Перед отправкой применяется настроенная фильтрация известных
          персональных и авторизационных данных. Несмотря на это, не вводите
          конфиденциальные сведения в поля, не предназначенные для их хранения.
        </Typography>
      </Box>

      {/* 9 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          9. Цели и основания обработки
        </Typography>
        <Typography sx={P_STYLE}>Данные обрабатываются для:</Typography>
        <Box component="ul" sx={UL_STYLE}>
          <li>
            предоставления запрошенной функциональности: регистрации, хранения,
            редактирования и экспорта резюме
          </li>
          <li>автосохранения и синхронизации данных аккаунта</li>
          <li>импорта выбранных публичных репозиториев GitHub</li>
          <li>
            выполнения AI-запросов после отдельного подтверждения пользователя
          </li>
          <li>
            обеспечения безопасности, предотвращения злоупотреблений и устранения
            технических ошибок
          </li>
        </Box>
        <Typography sx={P_STYLE}>
          В зависимости от применимого законодательства основанием может быть
          необходимость предоставить запрошенный вами сервис, ваше отдельное
          согласие для AI-функций и законный интерес в обеспечении безопасности и
          стабильности приложения.
        </Typography>
        <Typography sx={P_STYLE}>
          Мы не продаём данные пользователей и не используем содержимое резюме для
          показа рекламы.
        </Typography>
      </Box>

      {/* 10 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          10. Поставщики услуг
        </Typography>
        <Typography sx={P_STYLE}>
          Для работы Сервиса используются следующие сторонние сервисы:
        </Typography>
        <Box component="ul" sx={UL_STYLE}>
          <li>
            <strong>Supabase</strong> — аутентификация, база данных, хранение
            файлов и Edge Functions. Политика:{" "}
            <ExternalLink href="https://supabase.com/privacy">
              supabase.com/privacy
            </ExternalLink>
          </li>
          <li>
            <strong>Puter</strong> — отправка AI-запросов поставщику выбранной
            модели. Политика:{" "}
            <ExternalLink href="https://puter.com/privacy">
              puter.com/privacy
            </ExternalLink>
          </li>
          <li>
            <strong>OpenAI</strong> — поставщик используемой модели GPT-4o Mini.
            Политика:{" "}
            <ExternalLink href="https://openai.com/policies/privacy-policy/">
              openai.com/policies/privacy-policy
            </ExternalLink>
          </li>
          <li>
            <strong>GitHub</strong> — получение публичных сведений о репозиториях.
            Политика:{" "}
            <ExternalLink href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
              GitHub Privacy Statement
            </ExternalLink>
          </li>
          <li>
            <strong>Sentry</strong> — диагностика ошибок, если интеграция включена.
            Политика:{" "}
            <ExternalLink href="https://sentry.io/privacy/">
              sentry.io/privacy
            </ExternalLink>
          </li>
          <li>
            <strong>Vercel</strong> — размещение и доставка frontend-приложения.
            Политика:{" "}
            <ExternalLink href="https://vercel.com/legal/privacy-notice">
              vercel.com/legal/privacy-notice
            </ExternalLink>
          </li>
        </Box>
        <Typography sx={SMALL_STYLE}>
          Каждый поставщик самостоятельно применяет свою политику к данным,
          которые получает в рамках предоставляемой услуги.
        </Typography>
      </Box>

      {/* 11 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          11. Международная обработка данных
        </Typography>
        <Typography sx={P_STYLE}>
          Основные данные Сервиса хранятся в регионе, настроенном для
          production-проекта Supabase. Supabase предоставляет несколько регионов
          размещения, включая регионы в ЕС, США, Канаде и Азиатско-Тихоокеанском
          регионе.
        </Typography>
        <Typography sx={P_STYLE}>
          Vercel, Puter, OpenAI, Sentry, GitHub и их инфраструктурные поставщики
          могут обрабатывать технические или переданные им данные в других
          странах. Актуальную информацию о настроенном регионе production-проекта
          можно запросить по адресу{" "}
          <Box component="span" sx={getPlaceholderStyle(CONTACT_EMAIL)}>
            {CONTACT_EMAIL}
          </Box>
          .
        </Typography>
      </Box>

      {/* 12 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          12. Cookies и localStorage
        </Typography>
        <Typography sx={P_STYLE}>
          Приложение не устанавливает рекламные cookies. Supabase Auth использует
          браузерное хранилище для поддержания пользовательской сессии.
        </Typography>
        <Typography sx={P_STYLE}>
          Кроме данных сессии, в localStorage могут сохраняться:
        </Typography>
        <Box component="ul" sx={UL_STYLE}>
          <li>
            <code>cv_theme</code> — выбранная светлая или тёмная тема
          </li>
          <li>
            <code>cv_onboarding_collapsed</code> — состояние интерфейса онбординга
          </li>
          <li>
            техническая запись о подтверждении AI-обработки, включая версию
            уведомления и дату подтверждения; текст резюме и AI-запросов в этой
            записи не хранится
          </li>
        </Box>
        <Typography sx={P_STYLE}>
          Эти настройки остаются в браузере до их удаления приложением,
          пользователем или средствами браузера.
        </Typography>
      </Box>

      {/* 13 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          13. Сроки хранения и резервные копии
        </Typography>
        <Typography sx={P_STYLE}>
          Данные активного аккаунта и резюме хранятся до удаления аккаунта либо
          до получения и выполнения обоснованного запроса на удаление.
        </Typography>
        <Typography sx={P_STYLE}>
          Зашифрованное резервное копирование production-базы выполняется один раз
          в неделю. Backup-артефакты хранятся 30 дней. После удаления данных из
          основной базы их копии могут сохраняться в backup до окончания этого
          срока и затем удаляются по расписанию.
        </Typography>
      </Box>

      {/* 14 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          14. Безопасность
        </Typography>
        <Typography sx={P_STYLE}>
          Для защиты данных применяются разумные организационные и технические
          меры, включая:
        </Typography>
        <Box component="ul" sx={UL_STYLE}>
          <li>HTTPS для сетевых соединений</li>
          <li>
            Row Level Security в Supabase для ограничения доступа к строкам базы
          </li>
          <li>раздельное хранение публичных и серверных ключей</li>
          <li>шифрование резервных копий с использованием AES-256-CBC</li>
          <li>проверки CI на случайную публикацию секретов</li>
          <li>фильтрацию известных персональных данных в событиях Sentry</li>
        </Box>
        <Typography sx={P_STYLE}>
          Ни один способ хранения и передачи данных не обеспечивает абсолютную
          безопасность, однако мы стараемся снижать риски и своевременно устранять
          обнаруженные проблемы.
        </Typography>
      </Box>

      {/* 15 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          15. Ваши права
        </Typography>
        <Typography sx={P_STYLE}>
          В зависимости от применимого законодательства вы можете иметь право:
        </Typography>
        <Box component="ul" sx={UL_STYLE}>
          <li>получить сведения о своих персональных данных</li>
          <li>исправить неточные или устаревшие данные</li>
          <li>запросить удаление или ограничение обработки</li>
          <li>получить переносимую копию предоставленных данных</li>
          <li>отозвать согласие на AI-обработку</li>
          <li>возразить против отдельных видов обработки</li>
          <li>обратиться с жалобой в компетентный надзорный орган</li>
        </Box>
      </Box>

      {/* 16 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          16. Исправление, экспорт и удаление данных
        </Typography>
        <Typography sx={P_STYLE}>
          <strong>Исправление:</strong> данные резюме и профиля можно изменить в
          интерфейсе редактора.
        </Typography>
        <Typography sx={P_STYLE}>
          <strong>Экспорт резюме:</strong> готовое резюме можно скачать в PDF,
          DOCX, Markdown, PNG или JPG. Формирование этих файлов выполняется в
          браузере.
        </Typography>
        <Typography sx={P_STYLE}>
          <strong>Запрос данных или удаление аккаунта:</strong> направьте обращение
          по адресу{" "}
          <Box component="span" sx={getPlaceholderStyle(CONTACT_EMAIL)}>
            {CONTACT_EMAIL}
          </Box>
          . После удаления из активной базы данные могут оставаться в
          зашифрованных резервных копиях до 30 дней.
        </Typography>
      </Box>

      {/* 17 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          17. Несовершеннолетние
        </Typography>
        <Typography sx={P_STYLE}>
          Сервис не предназначен для лиц младше 16 лет. Если вы считаете, что
          несовершеннолетний передал данные без необходимого разрешения,
          свяжитесь с владельцем Сервиса для их удаления.
        </Typography>
      </Box>

      {/* 18 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          18. Изменения политики
        </Typography>
        <Typography sx={P_STYLE}>
          Политика может обновляться при изменении функций, поставщиков или
          требований законодательства. При существенных изменениях уведомление
          может быть размещено в интерфейсе Сервиса или направлено на email,
          связанный с аккаунтом.
        </Typography>
        <Typography sx={P_STYLE}>
          Дата последнего обновления: {LAST_UPDATED_DATE}.
        </Typography>
      </Box>

      {/* 19 */}
      <Box sx={SECTION_STYLE}>
        <Typography variant="h5" sx={H2_STYLE}>
          19. Контактная информация
        </Typography>
        <Typography sx={P_STYLE}>
          По вопросам конфиденциальности, доступа к данным или удаления аккаунта
          обращайтесь:{" "}
          <Box component="span" sx={getPlaceholderStyle(CONTACT_EMAIL)}>
            {CONTACT_EMAIL}
          </Box>
          .
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 6,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Управление согласием на AI-обработку
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Согласие можно отозвать рядом с AI-функциями в редакторе. При отзыве
          локальная запись о подтверждении удаляется, а перед следующим
          AI-запросом диалог будет показан повторно.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Отказ от AI-обработки не ограничивает обычное создание, редактирование и
          экспорт резюме.
        </Typography>
      </Box>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <MuiLink component={RouterLink} to="/" variant="body2" color="text.secondary">
          ← На главную
        </MuiLink>
      </Box>
    </Container>
  );
}
