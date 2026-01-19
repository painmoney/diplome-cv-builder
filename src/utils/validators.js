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

export const validateProfile = (profile = {}) => {
  const errors = {};

  if (profile.email && !isValidEmail(profile.email)) {
    errors.email = "Некорректный email (пример: name@example.com)";
  }

  if (profile.phone && !isValidPhone(profile.phone)) {
    errors.phone = "Некорректный телефон (пример: +7 (900) 123-45-67)";
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
