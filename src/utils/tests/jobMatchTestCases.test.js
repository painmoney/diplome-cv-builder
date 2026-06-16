import { describe, it, expect } from "vitest";
import { JOB_MATCH_TEST_CASES } from "../../dev/jobMatchTestCases";
import { getCoverLetterMode } from "../coverLetterSafetyUtils";

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
