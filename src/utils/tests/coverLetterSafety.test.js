import { describe, it, expect } from "vitest";
import {
  getCoverLetterMode,
  buildWeakMatchCoverLetter,
  buildSafeCoverLetterFallback,
  validateCoverLetterText,
  validateJobMatchAdviceText,
  cleanupGeneratedText,
  formatKeywordList,
  formatKeywordName,
  buildJobMatchAdviceFallback,
} from "../coverLetterSafetyUtils";

describe("formatKeywordName", () => {
  it("formats known keywords", () => {
    expect(formatKeywordName("git")).toBe("Git");
    expect(formatKeywordName("postgresql")).toBe("PostgreSQL");
    expect(formatKeywordName("fastapi")).toBe("FastAPI");
    expect(formatKeywordName("REST API")).toBe("REST API");
  });

  it("preserves unknown keywords", () => {
    expect(formatKeywordName("CustomTech")).toBe("CustomTech");
  });
});

describe("formatKeywordList", () => {
  it("returns empty string for empty array", () => {
    expect(formatKeywordList([])).toBe("");
  });

  it("returns single keyword", () => {
    expect(formatKeywordList(["Git"])).toBe("Git");
  });

  it("returns two keywords with и", () => {
    expect(formatKeywordList(["Git", "GitHub"])).toBe("Git и GitHub");
  });

  it("returns three keywords with commas and и", () => {
    expect(formatKeywordList(["Python", "Docker", "FastAPI"])).toBe("Python, Docker и FastAPI");
  });
});

describe("cleanupGeneratedText", () => {
  it("preserves normal text", () => {
    const input = "Меня заинтересовала ваша вакансия. В моём текущем резюме сильнее представлены веб-разработка, работа с API и проектный опыт.";
    const result = cleanupGeneratedText(input);
    expect(result).toContain("Меня заинтересовала");
    expect(result).toContain("ваша вакансия");
    expect(result).toContain("API");
    expect(result).not.toContain("Меня.аинтересовала");
    expect(result).not.toContain("аша.акансия");
  });

  it("removes extra spaces", () => {
    expect(cleanupGeneratedText("Меня   заинтересовала   вакансия")).toBe("Меня заинтересовала вакансия");
  });

  it("removes space before period", () => {
    expect(cleanupGeneratedText("слово .")).toBe("слово.");
  });

  it("removes space before comma", () => {
    expect(cleanupGeneratedText("слово ,")).toBe("слово,");
  });

  it("collapses multiple dots", () => {
    expect(cleanupGeneratedText("текст...")).toBe("текст.");
  });

  it("removes extra newlines", () => {
    expect(cleanupGeneratedText("а\n\n\n\nб")).toBe("а\n\nб");
  });
});

describe("getCoverLetterMode", () => {
  it("returns ai for strong frontend match", () => {
    const result = getCoverLetterMode({
      evidenceScore: 75,
      technicalScore: 80,
      confirmedExperience: ["React", "JavaScript"],
      confirmedProjects: ["GitHub"],
      declaredOnly: [],
      missingEvidence: [],
    });
    expect(result.mode).toBe("ai");
    expect(result.reasons).toHaveLength(0);
  });

  it("returns careful for Python backend hard mismatch", () => {
    const result = getCoverLetterMode({
      evidenceScore: 33,
      technicalScore: 25,
      confirmedExperience: [],
      confirmedProjects: ["Git", "GitHub"],
      declaredOnly: ["PostgreSQL", "SQL"],
      missingEvidence: ["Python", "Docker", "MongoDB", "FastAPI"],
    });
    expect(result.mode).toBe("careful");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("returns careful for Python backend skills-stuffing", () => {
    const result = getCoverLetterMode({
      evidenceScore: 51,
      technicalScore: 63,
      confirmedExperience: [],
      confirmedProjects: ["Git", "GitHub"],
      declaredOnly: ["Python", "Docker", "PostgreSQL", "MongoDB", "SQL"],
      missingEvidence: ["FastAPI"],
    });
    expect(result.mode).toBe("careful");
  });

  it("returns careful for DevOps mismatch", () => {
    const result = getCoverLetterMode({
      evidenceScore: 20,
      technicalScore: 40,
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: ["Docker", "CI/CD"],
      missingEvidence: ["Kubernetes", "Linux", "AWS"],
    });
    expect(result.mode).toBe("careful");
  });

  it("returns ai for Java partial but acceptable", () => {
    const result = getCoverLetterMode({
      evidenceScore: 75,
      technicalScore: 100,
      confirmedExperience: ["Java", "Spring Boot", "REST API"],
      confirmedProjects: [],
      declaredOnly: ["PostgreSQL", "Docker", "SQL"],
      missingEvidence: [],
    });
    expect(result.mode).toBe("ai");
  });

  it("returns careful when confirmed is empty", () => {
    const result = getCoverLetterMode({
      evidenceScore: 65,
      technicalScore: 55,
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: ["React"],
      missingEvidence: [],
    });
    expect(result.mode).toBe("careful");
  });
});

describe("buildWeakMatchCoverLetter", () => {
  it("contains no missingEvidence keywords", () => {
    const text = buildWeakMatchCoverLetter({
      name: "Иван Иванов",
      confirmedExperience: [],
      confirmedProjects: ["Git", "GitHub"],
      declaredOnly: ["PostgreSQL", "SQL"],
      companyName: "",
      positionName: "Python разработчик",
    });
    expect(text).not.toContain("Docker");
    expect(text).not.toContain("MongoDB");
    expect(text).not.toContain("FastAPI");
    expect(text).toContain("Git");
    expect(text).toContain("GitHub");
    expect(text).toContain("PostgreSQL");
    expect(text).toContain("SQL");
    expect(text).toContain("Иван Иванов");
  });

  it("contains no banned phrases", () => {
    const text = buildWeakMatchCoverLetter({
      name: "Тест",
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: [],
      companyName: "",
      positionName: "",
    });
    expect(text).not.toContain("у меня нет опыта");
    expect(text).not.toContain("готов освоить");
    expect(text).not.toContain("стремлюсь развиваться");
  });

  it("uses position phrase correctly", () => {
    const text = buildWeakMatchCoverLetter({
      name: "",
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: [],
      companyName: "",
      positionName: "Python разработчик",
    });
    expect(text).toContain("вакансия Python разработчик");
  });

  it("uses fallback when no position", () => {
    const text = buildWeakMatchCoverLetter({
      name: "",
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: [],
      companyName: "",
      positionName: "",
    });
    expect(text).toContain("ваша вакансия");
  });
});

describe("validateCoverLetterText", () => {
  it("rejects overclaim for declaredOnly", () => {
    const result = validateCoverLetterText(
      "У меня есть опыт работы с PostgreSQL и MongoDB.",
      {
        confirmedExperience: [],
        confirmedProjects: [],
        declaredOnly: ["PostgreSQL", "MongoDB"],
        missingEvidence: [],
        mode: "ai",
      }
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("overclaim"))).toBe(true);
  });

  it("rejects missingEvidence in body", () => {
    const result = validateCoverLetterText(
      "Я готов быстро освоить FastAPI и Docker.",
      {
        confirmedExperience: [],
        confirmedProjects: [],
        declaredOnly: [],
        missingEvidence: ["FastAPI", "Docker"],
        mode: "ai",
      }
    );
    expect(result.ok).toBe(false);
  });

  it("rejects banned phrases", () => {
    const result = validateCoverLetterText(
      "Я стремлюсь развиваться и готов освоить новые технологии.",
      {
        confirmedExperience: [],
        confirmedProjects: [],
        declaredOnly: [],
        missingEvidence: [],
        mode: "ai",
      }
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("banned phrase"))).toBe(true);
  });

  it("allows missingEvidence in position name", () => {
    const result = validateCoverLetterText(
      "Меня заинтересовала вакансия Python разработчика.",
      {
        confirmedExperience: [],
        confirmedProjects: [],
        declaredOnly: [],
        missingEvidence: ["Python"],
        positionName: "Python разработчик",
        mode: "ai",
      }
    );
    expect(result.ok).toBe(true);
  });

  it("rejects missingEvidence in careful mode", () => {
    const result = validateCoverLetterText(
      "Python — это важная технология.",
      {
        confirmedExperience: [],
        confirmedProjects: [],
        declaredOnly: [],
        missingEvidence: ["Python"],
        positionName: "Python разработчик",
        mode: "careful",
      }
    );
    expect(result.ok).toBe(false);
  });

  it("passes for clean text", () => {
    const result = validateCoverLetterText(
      "Здравствуйте! Меня заинтересовала вакансия. У меня есть опыт с React и JavaScript.",
      {
        confirmedExperience: ["React", "JavaScript"],
        confirmedProjects: [],
        declaredOnly: [],
        missingEvidence: [],
        mode: "ai",
      }
    );
    expect(result.ok).toBe(true);
  });
});

describe("buildJobMatchAdviceFallback", () => {
  it("contains all missingEvidence keywords", () => {
    const text = buildJobMatchAdviceFallback({
      confirmedExperience: [],
      confirmedProjects: ["Git"],
      declaredOnly: ["PostgreSQL"],
      missingEvidence: ["Python", "Docker", "MongoDB", "FastAPI"],
      evidenceScore: 33,
    });
    expect(text).toContain("Python");
    expect(text).toContain("Docker");
    expect(text).toContain("MongoDB");
    expect(text).toContain("FastAPI");
    expect(text).toContain("[missing]");
  });

  it("contains confirmed_experience when confirmed", () => {
    const text = buildJobMatchAdviceFallback({
      confirmedExperience: ["React", "JavaScript"],
      confirmedProjects: [],
      declaredOnly: [],
      missingEvidence: [],
      evidenceScore: 75,
    });
    expect(text).toContain("[confirmed_experience]");
    expect(text).toContain("React");
    expect(text).toContain("JavaScript");
  });
});

describe("buildSafeCoverLetterFallback", () => {
  it("frontend strong match — confident tone", () => {
    const text = buildSafeCoverLetterFallback({
      name: "Петрова Мария",
      positionName: "Frontend Developer",
      confirmedExperience: ["React", "TypeScript", "REST API"],
      confirmedProjects: ["Git"],
      declaredOnly: ["JavaScript", "HTML", "CSS"],
    });
    expect(text).toContain("React");
    expect(text).toContain("TypeScript");
    expect(text).toContain("REST API");
    expect(text).toContain("Git");
    expect(text).toContain("JavaScript");
    expect(text).toContain("HTML");
    expect(text).toContain("CSS");
    expect(text).toContain("указаны как навыки");
    expect(text).not.toContain("смежн");
    expect(text).not.toContain("сильнее представлены");
    expect(text).not.toContain("готов освоить");
    expect(text).toContain("Петрова Мария");
  });

  it("Java partial — no overclaim for declaredOnly", () => {
    const text = buildSafeCoverLetterFallback({
      name: "Козлов Дмитрий",
      positionName: "Backend Developer (Java)",
      confirmedExperience: ["Java", "Spring Boot", "REST API"],
      confirmedProjects: [],
      declaredOnly: ["PostgreSQL", "SQL", "Docker"],
    });
    expect(text).toContain("Java");
    expect(text).toContain("Spring Boot");
    expect(text).toContain("REST API");
    expect(text).toContain("PostgreSQL");
    expect(text).toContain("SQL");
    expect(text).toContain("Docker");
    expect(text).toContain("указаны как навыки");
    expect(text).not.toContain("смежн");
    expect(text).not.toContain("опыт работы с PostgreSQL");
    expect(text).not.toContain("опыт работы с Docker");
  });

  it("falls back to weak when no confirmed", () => {
    const text = buildSafeCoverLetterFallback({
      name: "Тест",
      positionName: "Python Developer",
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: ["Python"],
    });
    expect(text).toContain("Тест");
    expect(text).toContain("Python");
  });
});

describe("buildJobMatchAdviceFallback without missingEvidence", () => {
  it("does not contain [missing] when missingEvidence is empty", () => {
    const text = buildJobMatchAdviceFallback({
      confirmedExperience: ["Java", "Spring Boot", "REST API"],
      confirmedProjects: ["Git"],
      declaredOnly: ["PostgreSQL", "SQL", "Docker"],
      missingEvidence: [],
      evidenceScore: 75,
    });
    expect(text).toContain("[confirmed_experience]");
    expect(text).toContain("[confirmed_project]");
    expect(text).toContain("[declared_skill]");
    expect(text).not.toContain("[missing]");
    expect(text).not.toContain("Нет отсутствующих навыков");
    expect(text).not.toContain("добавляйте этот навык");
  });
});

describe("validateJobMatchAdviceText — missingEvidence checks", () => {
  it("rejects fake [missing] when missingEvidence is empty", () => {
    const result = validateJobMatchAdviceText(
      "1. [confirmed_experience] — Java подтверждён в опыте.\n2. [missing] — Нет отсутствующих навыков, добавляйте этот навык только при наличии реального опыта.",
      {
        confirmedExperience: ["Java"],
        confirmedProjects: [],
        declaredOnly: [],
        missingEvidence: [],
      }
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("[missing] present but missingEvidence is empty"))).toBe(true);
  });

  it("rejects fake missing text even without [missing] tag", () => {
    const result = validateJobMatchAdviceText(
      "1. [confirmed_experience] — Java подтверждён.\n2. Рекомендация: Нет отсутствующих навыков в резюме.",
      {
        confirmedExperience: ["Java"],
        confirmedProjects: [],
        declaredOnly: [],
        missingEvidence: [],
      }
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes("fake missing text"))).toBe(true);
  });

  it("accepts real missing line", () => {
    const result = validateJobMatchAdviceText(
      "1. [confirmed_experience] — React подтверждён в опыте.\n2. [missing] — FastAPI и Django не найдены в резюме. Добавляйте эти навыки только при наличии реального опыта.",
      {
        confirmedExperience: ["React"],
        confirmedProjects: [],
        declaredOnly: [],
        missingEvidence: ["FastAPI", "Django"],
      }
    );
    expect(result.ok).toBe(true);
  });
});
