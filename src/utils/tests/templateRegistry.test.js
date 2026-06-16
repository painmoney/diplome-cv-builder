import { describe, it, expect } from "vitest";
import {
  DEFAULT_TEMPLATE_ID,
  TEMPLATE_REGISTRY,
  TEMPLATE_IDS,
  getSafeTemplateId,
  getTemplateMeta,
  getTemplateDocxStyle,
} from "../templateRegistry";

describe("TEMPLATE_REGISTRY", () => {
  it("contains minimalist, academic, github", () => {
    expect(TEMPLATE_IDS).toContain("minimalist");
    expect(TEMPLATE_IDS).toContain("academic");
    expect(TEMPLATE_IDS).toContain("github");
  });

  it("every entry has required fields", () => {
    for (const tpl of Object.values(TEMPLATE_REGISTRY)) {
      expect(tpl.id).toBeTruthy();
      expect(tpl.label).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.docxAccent).toBeTruthy();
      expect(tpl.docxMuted).toBeTruthy();
      expect(typeof tpl.supportsPdf).toBe("boolean");
      expect(typeof tpl.supportsDocx).toBe("boolean");
      expect(typeof tpl.supportsMarkdown).toBe("boolean");
    }
  });
});

describe("getSafeTemplateId", () => {
  it("returns valid id for known template", () => {
    expect(getSafeTemplateId("minimalist")).toBe("minimalist");
    expect(getSafeTemplateId("academic")).toBe("academic");
    expect(getSafeTemplateId("github")).toBe("github");
  });

  it("returns DEFAULT_TEMPLATE_ID for unknown", () => {
    expect(getSafeTemplateId("unknown")).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("returns DEFAULT_TEMPLATE_ID for empty", () => {
    expect(getSafeTemplateId("")).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("returns DEFAULT_TEMPLATE_ID for null", () => {
    expect(getSafeTemplateId(null)).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("normalizes case", () => {
    expect(getSafeTemplateId("Minimalist")).toBe("minimalist");
    expect(getSafeTemplateId("ACADEMIC")).toBe("academic");
  });
});

describe("getTemplateMeta", () => {
  it("returns metadata for known template", () => {
    const meta = getTemplateMeta("academic");
    expect(meta).toBeTruthy();
    expect(meta.id).toBe("academic");
    expect(meta.label).toBe("Академический");
  });

  it("returns metadata for unknown template (falls back to default)", () => {
    const meta = getTemplateMeta("unknown");
    expect(meta).toBeTruthy();
    expect(meta.id).toBe("minimalist");
  });
});

describe("getTemplateDocxStyle", () => {
  it("returns correct accent/muted for academic", () => {
    const style = getTemplateDocxStyle("academic");
    expect(style.accent).toBe("2E7D32");
    expect(style.muted).toBe("555555");
  });

  it("returns default style for unknown template", () => {
    const style = getTemplateDocxStyle("unknown");
    expect(style.accent).toBe("1976D2");
    expect(style.muted).toBe("555555");
  });
});
