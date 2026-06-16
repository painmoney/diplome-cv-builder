// ── Template Registry — единый источник правды для шаблонов ─────────
// Plain metadata без React/PDF imports.
// Preview и PDF components вынесены в отдельные registries.

export const DEFAULT_TEMPLATE_ID = "minimalist";

export const TEMPLATE_REGISTRY = {
  minimalist: {
    id: "minimalist",
    label: "Минималистичный",
    description: "Чистый современный стиль для продуктовых команд и стартапов.",
    category: "product",
    docxAccent: "1976D2",
    docxMuted: "555555",
    supportsPdf: true,
    supportsDocx: true,
    supportsMarkdown: true,
  },
  academic: {
    id: "academic",
    label: "Академический",
    description: "Строгая типографика и двухколоночная сетка для исследований и вузов.",
    category: "research",
    docxAccent: "2E7D32",
    docxMuted: "555555",
    supportsPdf: true,
    supportsDocx: true,
    supportsMarkdown: true,
  },
  github: {
    id: "github",
    label: "GitHub-стиль",
    description: 'Тёмная "терминальная" эстетика для разработчиков и open-source.',
    category: "dev",
    docxAccent: "0969DA",
    docxMuted: "57606A",
    supportsPdf: true,
    supportsDocx: true,
    supportsMarkdown: true,
  },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY);

/**
 * Возвращает безопасный template id. Для неизвестного/пустого — DEFAULT_TEMPLATE_ID.
 */
export function getSafeTemplateId(templateId) {
  const id = String(templateId || "").toLowerCase().trim();
  if (id && TEMPLATE_REGISTRY[id]) return id;
  return DEFAULT_TEMPLATE_ID;
}

/**
 * Возвращает metadata для template id.
 */
export function getTemplateMeta(templateId) {
  return TEMPLATE_REGISTRY[getSafeTemplateId(templateId)];
}

/**
 * Возвращает { accent, muted } для DOCX export.
 */
export function getTemplateDocxStyle(templateId) {
  const meta = TEMPLATE_REGISTRY[getSafeTemplateId(templateId)];
  return { accent: meta.docxAccent, muted: meta.docxMuted };
}
