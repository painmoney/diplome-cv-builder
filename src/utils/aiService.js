export function isAIAvailable() {
  return (
    typeof window !== "undefined" &&
    typeof window.puter !== "undefined" &&
    typeof window.puter.ai !== "undefined" &&
    typeof window.puter.ai.chat === "function"
  );
}

export function extractAIText(response) {
  if (!response) return "";
  const msg = response.message || response;
  if (typeof msg === "string") return msg;
  if (typeof msg.content === "string") return msg.content;
  if (Array.isArray(msg.content) && msg.content.length > 0) {
    return msg.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .filter(Boolean)
      .join("");
  }
  if (typeof msg.text === "string") return msg.text;
  return "";
}

export async function improveExperienceDescription({ description, position, company }) {
  if (!isAIAvailable()) {
    throw new Error("AI-сервис недоступен");
  }

  const prompt = `Ты — эксперт по составлению резюме. Переформулируй описание опыта работы более профессионально.

Должность: ${position || "Не указана"}
Компания: ${company || "Не указана"}

Исходное описание:
${description}

ЖЁСТКИЕ ПРАВИЛА:
1. ТОЛЬКО переформулируй исходные факты. НИЧЕГО нового не добавляй.
2. ЗАПРЕЩЕНО выдумывать: обязанности, достижения, задачи, процессы, которых нет в исходнике.
3. ЗАПРЕЩЕНО добавлять: code review, mentoring, team leadership, наставничество, проведение собеседований, внедрение процессов, если об этом нет в исходном тексте.
4. ЗАПРЕЩЕНО добавлять оценки качества (стабильность, производительность, отзывчивость, масштабируемость), если их нет в исходнике.
5. Количество пунктов = количество фактов в исходнике. Если 3 факта — 3 пункта, не 4–5.
6. Раскрывай сокращения: TS → TypeScript, WS → WebSocket, CRM → CRM (если аббревиатура, оставляй), FE → Frontend.
7. Используй глаголы действия (разработал, внедрил, оптимизировал).
8. Если данных мало — сделай аккуратную формулировку без расширения.

Формат: каждый пункт с тире (- ) на новой строке.
Язык: русский.
Ответь ТОЛЬКО улучшенным текстом, без объяснений и вступлений.`;

  const response = await window.puter.ai.chat(prompt, {
    model: "openai/gpt-4o-mini",
  });

  return extractAIText(response).trim();
}
