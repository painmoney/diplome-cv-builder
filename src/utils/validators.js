export const isValidEmail = (email) => {
  const v = String(email || "").trim();
  if (!v) return true; // email не обязателен, но если заполнен — должен быть валидный

  // достаточно строгая и безопасная проверка для UI
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return re.test(v);
};

export const normalizePhone = (phone) => String(phone || "").trim();

export const isValidPhone = (phone) => {
  const v = normalizePhone(phone);
  if (!v) return true; // телефон не обязателен, но если заполнен — должен быть валидный

  // Разрешаем +, пробелы, скобки, дефисы
  const allowed = /^[+0-9()\s-]+$/;
  if (!allowed.test(v)) return false;

  // Проверяем количество цифр (универсально для RU/International)
  const digits = v.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

export const isValidUrl = (url) => {
  const v = String(url || "").trim();
  if (!v) return true; // поле необязательное
  // Мягкая проверка: должен начинаться с http(s):// или быть похож на домен
  return /^(https?:\/\/[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s]*$)/.test(v);
};

export const isValidTelegram = (value) => {
  const v = String(value || "").trim();
  if (!v) return true; // поле необязательное
  // Разрешаем: username, @username, t.me/username, https://t.me/username
  return /^(@?[a-zA-Z0-9_]+|https?:\/\/t\.me\/[a-zA-Z0-9_]+|t\.me\/[a-zA-Z0-9_]+)$/.test(v);
};

export const validateProfile = (profile = {}) => {
  const errors = {};

  if (profile.email && !isValidEmail(profile.email)) {
    errors.email = "Некорректный email (пример: name@example.com)";
  }

  if (profile.phone && !isValidPhone(profile.phone)) {
    errors.phone = "Некорректный телефон (пример: +7 (900) 123-45-67)";
  }

  if (profile.githubUrl && !isValidUrl(profile.githubUrl)) {
    errors.githubUrl = "Некорректный URL (пример: https://github.com/username)";
  }

  if (profile.website && !isValidUrl(profile.website)) {
    errors.website = "Некорректный URL (пример: https://portfolio.example.com)";
  }

  if (profile.linkedin && !isValidUrl(profile.linkedin)) {
    errors.linkedin = "Некорректный URL (пример: https://linkedin.com/in/username)";
  }

  if (profile.habrCareer && !isValidUrl(profile.habrCareer)) {
    errors.habrCareer = "Некорректный URL (пример: https://career.habr.com/username)";
  }

  if (profile.telegram && !isValidTelegram(profile.telegram)) {
    errors.telegram = "Некорректный Telegram (пример: @username или https://t.me/username)";
  }

  return errors;
};

export const formatValidationToast = (errors = {}) => {
  const fields = [];
  if (errors.email) fields.push("Email");
  if (errors.phone) fields.push("Телефон");

  if (!fields.length) return null;

  return `Проверьте поля: ${fields.join(", ")}. Исправьте ошибки и сохраните снова.`;
};
