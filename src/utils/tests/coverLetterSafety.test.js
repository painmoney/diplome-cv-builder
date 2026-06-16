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
  getEvidenceBreakdownSummary,
  buildSafeNextActions,
  buildApplicationReadiness,
  buildDeclaredSkillTip,
} from "../coverLetterSafetyUtils";
import { TECHNOLOGY_KEYS } from "../technologyRegistry";

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

  it("returns correct display names via registry for problem technologies", () => {
    expect(formatKeywordName("testing")).toBe("Testing");
    expect(formatKeywordName("rest api")).toBe("REST API");
    expect(formatKeywordName("github actions")).toBe("GitHub Actions");
    expect(formatKeywordName("gitlab ci")).toBe("GitLab CI");
    expect(formatKeywordName("vs code")).toBe("VS Code");
    expect(formatKeywordName("ms sql server")).toBe("MS SQL Server");
    expect(formatKeywordName("spring boot")).toBe("Spring Boot");
    expect(formatKeywordName("styled components")).toBe("Styled Components");
    expect(formatKeywordName("docker compose")).toBe("Docker Compose");
    expect(formatKeywordName("testing library")).toBe("Testing Library");
  });

  it("resolves aliases through registry", () => {
    expect(formatKeywordName("reactjs")).toBe("React");
    expect(formatKeywordName("postgres")).toBe("PostgreSQL");
    expect(formatKeywordName("nodejs")).toBe("Node.js");
    expect(formatKeywordName("ts")).toBe("TypeScript");
    expect(formatKeywordName("restful")).toBe("REST API");
    expect(formatKeywordName("k8s")).toBe("Kubernetes");
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

describe("getEvidenceBreakdownSummary", () => {
  it("returns correct groups", () => {
    const groups = getEvidenceBreakdownSummary({
      confirmedExperience: ["React"],
      confirmedProjects: ["Git"],
      declaredOnly: ["Python"],
      missingEvidence: ["Docker"],
    });
    expect(groups.length).toBe(4);
    expect(groups[0].key).toBe("confirmed_experience");
    expect(groups[3].key).toBe("missing");
  });

  it("skips empty groups", () => {
    const groups = getEvidenceBreakdownSummary({
      confirmedExperience: ["React"],
      confirmedProjects: [],
      declaredOnly: [],
      missingEvidence: [],
    });
    expect(groups.length).toBe(1);
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

describe("buildApplicationReadiness", () => {
  it("ready for strong match", () => {
    const r = buildApplicationReadiness({ technicalScore: 80, evidenceScore: 75, mode: "ai" });
    expect(r.status).toBe("ready");
    expect(r.color).toBe("success");
  });

  it("partial for medium match", () => {
    const r = buildApplicationReadiness({ technicalScore: 55, evidenceScore: 50, mode: "ai" });
    expect(r.status).toBe("partial");
    expect(r.color).toBe("warning");
  });

  it("needs_work for hard mismatch", () => {
    const r = buildApplicationReadiness({ technicalScore: 25, evidenceScore: 33, mode: "careful" });
    expect(r.status).toBe("needs_work");
    expect(r.color).toBe("error");
  });

  it("needs_work when scores missing", () => {
    const r = buildApplicationReadiness({ technicalScore: null, evidenceScore: null, mode: "careful" });
    expect(r.status).toBe("needs_work");
  });

  it("ready with declaredOnly gets detailed description", () => {
    const r = buildApplicationReadiness({
      technicalScore: 100,
      evidenceScore: 76,
      mode: "ai",
      declaredOnly: ["PostgreSQL", "SQL", "Docker"],
    });
    expect(r.status).toBe("ready");
    expect(r.description.toLowerCase()).toContain("часть стека указана только в навыках");
  });

  it("ready without declaredOnly gets short description", () => {
    const r = buildApplicationReadiness({
      technicalScore: 80,
      evidenceScore: 75,
      mode: "ai",
      declaredOnly: [],
    });
    expect(r.status).toBe("ready");
    expect(r.description).not.toContain("часть стека");
  });
});

describe("buildSafeNextActions", () => {
  it("missingEvidence generates warning", () => {
    const actions = buildSafeNextActions({
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: [],
      missingEvidence: ["Python", "Docker"],
      evidenceScore: 33,
    });
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].type).toBe("warning");
    expect(actions[0].text).toContain("Python");
  });

  it("no fake recommendation when missingEvidence empty", () => {
    const actions = buildSafeNextActions({
      confirmedExperience: ["Java", "Spring Boot"],
      confirmedProjects: ["Git"],
      declaredOnly: ["PostgreSQL"],
      missingEvidence: [],
      evidenceScore: 75,
    });
    const hasFakeMissing = actions.some((a) => a.text.includes("отсутствующи"));
    expect(hasFakeMissing).toBe(false);
  });

  it("declaredOnly-heavy gives info action", () => {
    const actions = buildSafeNextActions({
      confirmedExperience: ["React"],
      confirmedProjects: [],
      declaredOnly: ["Python", "Docker", "MongoDB"],
      missingEvidence: [],
      evidenceScore: 50,
    });
    expect(actions.some((a) => a.text.includes("заявленные навыки"))).toBe(true);
  });

  it("declaredOnly equal to confirmed gives info action", () => {
    const actions = buildSafeNextActions({
      confirmedExperience: ["Java", "Spring Boot", "REST API"],
      confirmedProjects: [],
      declaredOnly: ["PostgreSQL", "SQL", "Docker"],
      missingEvidence: [],
      evidenceScore: 76,
    });
    expect(actions.some((a) => a.text.includes("заявленные навыки"))).toBe(true);
  });

  it("strong match gives success action", () => {
    const actions = buildSafeNextActions({
      confirmedExperience: ["React", "JavaScript"],
      confirmedProjects: ["GitHub"],
      declaredOnly: [],
      missingEvidence: [],
      evidenceScore: 75,
    });
    expect(actions.some((a) => a.type === "success")).toBe(true);
  });
});

describe("buildDeclaredSkillTip", () => {
  it("returns structured tip for PostgreSQL", () => {
    const tip = buildDeclaredSkillTip("postgresql");
    expect(tip).toHaveProperty("title");
    expect(tip).toHaveProperty("description");
    expect(tip).toHaveProperty("safeActions");
    expect(tip).toHaveProperty("avoid");
    expect(tip).toHaveProperty("targetSuggestions");
    expect(tip.title).toContain("PostgreSQL");
    expect(tip.description.length).toBeGreaterThan(20);
    expect(tip.safeActions.length).toBeGreaterThan(0);
    expect(tip.avoid.length).toBeGreaterThan(0);
    expect(tip.targetSuggestions.length).toBeGreaterThan(0);
  });

  it("PostgreSQL tip does not claim experience", () => {
    const tip = buildDeclaredSkillTip("postgresql");
    const allText = [tip.description, ...tip.safeActions, ...tip.avoid].join(" ").toLowerCase();
    expect(allText).not.toContain("у вас есть опыт");
    expect(allText).not.toContain("вы работали с");
    expect(allText).not.toContain("коммерческий опыт");
  });

  it("Docker tip mentions project and does not mention commercial experience", () => {
    const tip = buildDeclaredSkillTip("docker");
    const allText = [tip.description, ...tip.safeActions].join(" ").toLowerCase();
    expect(allText).toContain("проект");
    expect(allText).not.toContain("коммерческий");
  });

  it("Python tip contains safe phrasing about real usage", () => {
    const tip = buildDeclaredSkillTip("python");
    const allText = [tip.description, ...tip.safeActions].join(" ").toLowerCase();
    expect(allText).toContain("реальн");
  });

  it("returns safe fallback for empty keyword", () => {
    const tip = buildDeclaredSkillTip("");
    expect(tip.title).toBeTruthy();
    expect(tip.description).toBeTruthy();
    expect(tip.safeActions.length).toBeGreaterThan(0);
  });

  it("returns safe fallback for unknown keyword", () => {
    const tip = buildDeclaredSkillTip("CustomTech123");
    expect(tip.title).toBeTruthy();
    expect(tip.description).toBeTruthy();
    expect(tip.safeActions.length).toBeGreaterThan(0);
  });

  it("missing keyword should not be processed as declaredOnly", () => {
    const tip = buildDeclaredSkillTip("python");
    expect(tip.title).toContain("Python");
    expect(tip.description).not.toContain("отсутствует");
  });

  it("tips do not contain banned phrases", () => {
    const banned = [
      "просто добавьте",
      "у вас есть опыт",
      "вы работали с",
      "коммерческий опыт",
      "точно повысит",
      "куда добавить evidence",
    ];
    const keywords = ["postgresql", "docker", "python", "javascript", "ci/cd", "react", "sql", "mongodb"];
    for (const kw of keywords) {
      const tip = buildDeclaredSkillTip(kw);
      const allText = [tip.description, ...tip.safeActions, ...tip.avoid].join(" ").toLowerCase();
      for (const phrase of banned) {
        expect(allText).not.toContain(phrase);
      }
    }
  });

  it("no literal X in avoid text for unknown keywords", () => {
    const tip = buildDeclaredSkillTip("unknownlib");
    const avoidText = tip.avoid.join(" ");
    expect(avoidText).not.toMatch(/\bX\b/);
    expect(tip.avoid.length).toBeGreaterThanOrEqual(1);
    expect(tip.safeActions.length).toBeGreaterThanOrEqual(1);
  });

  it("SQL tip is specific, not generic fallback", () => {
    const tip = buildDeclaredSkillTip("sql");
    expect(tip.title).toContain("SQL");
    const allText = [tip.description, ...tip.safeActions].join(" ").toLowerCase();
    expect(allText).toContain("sql");
    expect(allText).toContain("запрос");
  });

  it("MongoDB tip is specific, not generic fallback", () => {
    const tip = buildDeclaredSkillTip("mongodb");
    expect(tip.title).toContain("MongoDB");
    const allText = [tip.description, ...tip.safeActions].join(" ").toLowerCase();
    expect(allText).toContain("mongodb");
    expect(allText).toContain("коллекци");
  });

  it("targetSuggestions include experience and github tabs", () => {
    const tip = buildDeclaredSkillTip("docker");
    const tabs = tip.targetSuggestions.map((s) => s.tab);
    expect(tabs).toContain(3);
    expect(tabs).toContain(4);
  });

  it("all specific tips have safeActions and avoid sections", () => {
    const keywords = [
      "postgresql", "docker", "python", "javascript", "html",
      "css", "ci/cd", "react", "git", "rest api", "gitlab", "sql", "mongodb",
    ];
    for (const kw of keywords) {
      const tip = buildDeclaredSkillTip(kw);
      expect(tip.safeActions.length).toBeGreaterThanOrEqual(1);
      expect(tip.avoid.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("template tips work for technologies without specific tips", () => {
    const ts = buildDeclaredSkillTip("typescript");
    expect(ts.title).toContain("TypeScript");
    expect(ts.description).toContain("TypeScript");
    expect(ts.safeActions.length).toBeGreaterThanOrEqual(2);

    const springBoot = buildDeclaredSkillTip("spring boot");
    expect(springBoot.title).toContain("Spring Boot");
    expect(springBoot.description).toContain("Spring Boot");

    const jest = buildDeclaredSkillTip("jest");
    expect(jest.title).toContain("Jest");
    expect(jest.description).toContain("Jest");

    const ghActions = buildDeclaredSkillTip("github actions");
    expect(ghActions.title).toContain("GitHub Actions");
    expect(ghActions.description).toContain("GitHub Actions");

    const vite = buildDeclaredSkillTip("vite");
    expect(vite.title).toContain("Vite");
    expect(vite.description).toContain("Vite");

    const aws = buildDeclaredSkillTip("aws");
    expect(aws.title).toContain("AWS");
    expect(aws.description).toContain("AWS");

    const graphql = buildDeclaredSkillTip("graphql");
    expect(graphql.title).toContain("GraphQL");
    expect(graphql.description).toContain("GraphQL");
  });

  it("aliases resolve to correct tips", () => {
    const reactAlias = buildDeclaredSkillTip("reactjs");
    expect(reactAlias.title).toContain("React");
    expect(reactAlias.description).toContain("React");

    const postgresAlias = buildDeclaredSkillTip("postgres");
    expect(postgresAlias.title).toContain("PostgreSQL");
    expect(postgresAlias.description).toContain("PostgreSQL");

    const tsAlias = buildDeclaredSkillTip("ts");
    expect(tsAlias.title).toContain("TypeScript");
    expect(tsAlias.description).toContain("TypeScript");

    const restfulAlias = buildDeclaredSkillTip("restful");
    expect(restfulAlias.title).toContain("REST API");
    expect(restfulAlias.description).toContain("REST API");
  });

  it("every registry entry gets a valid tip structure", () => {
    for (const key of TECHNOLOGY_KEYS) {
      const tip = buildDeclaredSkillTip(key);
      expect(tip.title).toBeTruthy();
      expect(tip.description).toBeTruthy();
      expect(tip.safeActions.length).toBeGreaterThanOrEqual(1);
      expect(tip.avoid.length).toBeGreaterThanOrEqual(1);
      expect(tip.targetSuggestions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("template tips do not contain banned phrases", () => {
    const banned = [
      "просто добавьте",
      "у вас есть опыт",
      "вы работали с",
      "коммерческий опыт",
      "точно повысит",
      "гарантирует",
      "идеально подходит",
    ];
    const keywords = ["typescript", "spring boot", "jest", "github actions", "vite", "aws", "graphql", "vue", "angular"];
    for (const kw of keywords) {
      const tip = buildDeclaredSkillTip(kw);
      const allText = [tip.description, ...tip.safeActions, ...tip.avoid].join(" ").toLowerCase();
      for (const phrase of banned) {
        expect(allText).not.toContain(phrase);
      }
    }
  });
});
