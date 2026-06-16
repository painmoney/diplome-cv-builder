import { describe, it, expect } from "vitest";
import { buildResumeEvidenceMap, classifyKeywordEvidence } from "../jobMatchUtils";

const baseResume = {
  profile: { name: "Test User", email: "test@test.com", about: "Backend developer" },
  skills: [{ name: "React" }, { name: "TypeScript" }, { name: "Docker" }],
  experience: [{ company: "Co", position: "Dev", description: "Built REST API" }],
  education: [{ institution: "Uni" }],
  github: [],
  projects: [],
};

describe("buildResumeEvidenceMap - manual projects", () => {
  it("includes manual project techStack in projectsText", () => {
    const data = {
      ...baseResume,
      projects: [
        { id: "1", name: "CV Builder", description: "Web app", techStack: "React, Supabase" },
      ],
    };
    const map = buildResumeEvidenceMap(data);
    expect(map.projectsText).toContain("react");
    expect(map.projectsText).toContain("supabase");
  });

  it("includes manual project description in projectsText", () => {
    const data = {
      ...baseResume,
      projects: [
        { id: "1", name: "API Gateway", description: "Built a REST API gateway with Node.js" },
      ],
    };
    const map = buildResumeEvidenceMap(data);
    expect(map.projectsText).toContain("rest api");
    expect(map.projectsText).toContain("node.js");
  });

  it("excludes empty projects (no description, no techStack)", () => {
    const data = {
      ...baseResume,
      projects: [{ id: "1", name: "Empty", link: "https://example.com" }],
    };
    const map = buildResumeEvidenceMap(data);
    expect(map.projectsText).not.toContain("empty");
  });

  it("excludes link-only projects from evidence", () => {
    const data = {
      ...baseResume,
      projects: [{ id: "1", link: "https://kubernetes.io" }],
    };
    const map = buildResumeEvidenceMap(data);
    expect(map.projectsText).not.toContain("kubernetes");
  });

  it("includes project role in projectsText", () => {
    const data = {
      ...baseResume,
      projects: [
        { id: "1", name: "App", role: "Fullstack Developer", techStack: "React, Node.js" },
      ],
    };
    const map = buildResumeEvidenceMap(data);
    expect(map.projectsText).toContain("fullstack developer");
  });

  it("preserves github evidence alongside manual projects", () => {
    const data = {
      ...baseResume,
      projects: [{ id: "1", name: "App", techStack: "React" }],
      github: [
        { name: "Repo", description: "TypeScript project", url: "https://github.com/u/r", languages: ["TypeScript"] },
      ],
    };
    const map = buildResumeEvidenceMap(data);
    expect(map.projectsText).toContain("react");
    expect(map.projectsText).toContain("typescript");
  });

  it("does not mutate data.projects", () => {
    const projects = [{ id: "1", name: "App", techStack: "React" }];
    const data = { ...baseResume, projects };
    buildResumeEvidenceMap(data);
    expect(projects).toHaveLength(1);
  });
});

describe("classifyKeywordEvidence - manual project priority", () => {
  it("experience has priority over projects", () => {
    const data = {
      ...baseResume,
      experience: [{ company: "Co", position: "Dev", description: "Used React in production" }],
      projects: [{ id: "1", name: "App", techStack: "React" }],
    };
    const map = buildResumeEvidenceMap(data);
    const result = classifyKeywordEvidence("react", map);
    expect(result.status).toBe("confirmed_experience");
    expect(result.source).toBe("experience");
  });

  it("manual project confirms keyword as project evidence when not in experience", () => {
    const data = {
      ...baseResume,
      experience: [],
      projects: [{ id: "1", name: "App", techStack: "Supabase, Postgres" }],
    };
    const map = buildResumeEvidenceMap(data);
    const result = classifyKeywordEvidence("supabase", map);
    expect(result.status).toBe("confirmed_project");
  });

  it("GitHub evidence still works", () => {
    const data = {
      ...baseResume,
      experience: [],
      projects: [],
      github: [{ name: "Repo", description: "TypeScript project", languages: ["TypeScript"] }],
    };
    const map = buildResumeEvidenceMap(data);
    const result = classifyKeywordEvidence("typescript", map);
    expect(result.status).toBe("confirmed_project");
  });

  it("skill-only stays declared_skill", () => {
    const data = {
      ...baseResume,
      experience: [],
      projects: [],
      github: [],
    };
    const map = buildResumeEvidenceMap(data);
    const result = classifyKeywordEvidence("docker", map);
    expect(result.status).toBe("declared_skill");
  });

  it("missing evidence stays missing", () => {
    const data = {
      ...baseResume,
      experience: [],
      projects: [],
      github: [],
    };
    const map = buildResumeEvidenceMap(data);
    const result = classifyKeywordEvidence("kubernetes", map);
    expect(result.status).toBe("missing");
  });
});
