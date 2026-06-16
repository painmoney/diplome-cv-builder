import { describe, it, expect } from "vitest";
import { JOB_MATCH_TEST_CASES } from "../../dev/jobMatchTestCases";
import { getCoverLetterMode } from "../coverLetterSafetyUtils";
import { getKeywordLabel, extractKeywordsFromText } from "../jobMatchUtils";

describe("JOB_MATCH_TEST_CASES", () => {
  it("has unique ids", () => {
    const ids = JOB_MATCH_TEST_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each case has required fields", () => {
    for (const tc of JOB_MATCH_TEST_CASES) {
      expect(tc.id).toBeTruthy();
      expect(tc.title).toBeTruthy();
      expect(tc.jobText).toBeTruthy();
      expect(tc.resumeData).toBeTruthy();
      expect(tc.expectedMode).toMatch(/^(ai|careful)$/);
      expect(Array.isArray(tc.expected)).toBe(true);
    }
  });

  it("each case has resumeData with profile and skills", () => {
    for (const tc of JOB_MATCH_TEST_CASES) {
      expect(tc.resumeData.profile).toBeTruthy();
      expect(tc.resumeData.profile.name).toBeTruthy();
      expect(Array.isArray(tc.resumeData.skills)).toBe(true);
      expect(tc.resumeData.skills.length).toBeGreaterThan(0);
    }
  });
});

describe("Case A — Python backend hard mismatch", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "python-hard-mismatch");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns careful", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 33,
      technicalScore: 25,
      confirmedExperience: [],
      confirmedProjects: ["Git", "GitHub"],
      declaredOnly: ["PostgreSQL", "SQL"],
      missingEvidence: ["Python", "Docker", "MongoDB", "FastAPI"],
    });
    expect(mode.mode).toBe("careful");
  });
});

describe("Case B — Python skills-stuffing", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "python-skills-stuffing");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns careful despite higher scores", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 51,
      technicalScore: 63,
      confirmedExperience: [],
      confirmedProjects: ["Git", "GitHub"],
      declaredOnly: ["Python", "Docker", "PostgreSQL", "MongoDB", "SQL"],
      missingEvidence: ["FastAPI"],
    });
    expect(mode.mode).toBe("careful");
  });
});

describe("Case C — Frontend strong match", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "frontend-strong-match");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns ai", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 75,
      technicalScore: 80,
      confirmedExperience: ["React", "JavaScript"],
      confirmedProjects: ["GitHub"],
      declaredOnly: [],
      missingEvidence: [],
    });
    expect(mode.mode).toBe("ai");
  });
});

describe("Case D — Java backend partial", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "java-backend-partial");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns ai", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 75,
      technicalScore: 100,
      confirmedExperience: ["Java", "Spring Boot", "REST API"],
      confirmedProjects: [],
      declaredOnly: ["PostgreSQL", "Docker", "SQL"],
      missingEvidence: [],
    });
    expect(mode.mode).toBe("ai");
  });
});

describe("Case E — DevOps mismatch", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "devops-mismatch");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns careful", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 20,
      technicalScore: 40,
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: ["Docker", "CI/CD"],
      missingEvidence: ["Kubernetes", "Linux", "AWS"],
    });
    expect(mode.mode).toBe("careful");
  });
});

describe("getKeywordLabel — registry display names", () => {
  it("returns correct display names for problem technologies", () => {
    expect(getKeywordLabel("testing")).toBe("Testing");
    expect(getKeywordLabel("rest api")).toBe("REST API");
    expect(getKeywordLabel("github actions")).toBe("GitHub Actions");
    expect(getKeywordLabel("gitlab ci")).toBe("GitLab CI");
    expect(getKeywordLabel("vs code")).toBe("VS Code");
    expect(getKeywordLabel("ms sql server")).toBe("MS SQL Server");
    expect(getKeywordLabel("spring boot")).toBe("Spring Boot");
    expect(getKeywordLabel("styled components")).toBe("Styled Components");
    expect(getKeywordLabel("docker compose")).toBe("Docker Compose");
    expect(getKeywordLabel("testing library")).toBe("Testing Library");
  });

  it("resolves aliases through registry", () => {
    expect(getKeywordLabel("reactjs")).toBe("React");
    expect(getKeywordLabel("postgres")).toBe("PostgreSQL");
    expect(getKeywordLabel("nodejs")).toBe("Node.js");
    expect(getKeywordLabel("ts")).toBe("TypeScript");
    expect(getKeywordLabel("restful")).toBe("REST API");
    expect(getKeywordLabel("k8s")).toBe("Kubernetes");
  });

  it("preserves original for keywords in ALL_KEYWORDS", () => {
    expect(getKeywordLabel("react")).toBe("React");
    expect(getKeywordLabel("javascript")).toBe("JavaScript");
    expect(getKeywordLabel("postgresql")).toBe("PostgreSQL");
    expect(getKeywordLabel("docker")).toBe("Docker");
  });

  it("falls back to capitalization for unknown keywords", () => {
    expect(getKeywordLabel("unknown")).toBe("Unknown");
    expect(getKeywordLabel("customtech")).toBe("Customtech");
  });
});

describe("extractKeywordsFromText — Stage C-1 safe additions", () => {
  it("detects Testing Library in vacancy text", () => {
    const result = extractKeywordsFromText("We use Testing Library for component tests");
    expect(result).toContain("testing library");
  });

  it("detects Testing Library in resume context", () => {
    const result = extractKeywordsFromText("React components are tested with Testing Library");
    expect(result).toContain("testing library");
  });

  it("detects Docker Compose in vacancy text", () => {
    const result = extractKeywordsFromText("Docker Compose is used for local development");
    expect(result).toContain("docker compose");
  });

  it("detects Docker Compose in resume context", () => {
    const result = extractKeywordsFromText("Configured Docker Compose for multi-service architecture");
    expect(result).toContain("docker compose");
  });
});

describe("display — Stage C-1 safe additions", () => {
  it("getKeywordLabel returns correct names", () => {
    expect(getKeywordLabel("testing library")).toBe("Testing Library");
    expect(getKeywordLabel("docker compose")).toBe("Docker Compose");
  });
});
