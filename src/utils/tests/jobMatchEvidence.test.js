import { describe, it, expect } from "vitest";
import { buildResumeEvidenceMap, classifyKeywordEvidence, analyzeJobMatch } from "../jobMatchUtils";

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

describe("Supabase evidence pipeline", () => {
  it("Supabase in manual project → confirmedProjects", () => {
    const data = {
      ...baseResume,
      experience: [],
      projects: [{ id: "1", name: "CV Builder", techStack: "React, Supabase, Vite" }],
    };
    const map = buildResumeEvidenceMap(data);
    const result = classifyKeywordEvidence("supabase", map);
    expect(result.status).toBe("confirmed_project");
    expect(result.source).toBe("projects");
  });

  it("Supabase in experience → confirmedExperience (priority over project)", () => {
    const data = {
      ...baseResume,
      experience: [{ company: "Co", position: "Dev", description: "Built app with Supabase" }],
      projects: [{ id: "1", name: "App", techStack: "Supabase" }],
    };
    const map = buildResumeEvidenceMap(data);
    const result = classifyKeywordEvidence("supabase", map);
    expect(result.status).toBe("confirmed_experience");
    expect(result.source).toBe("experience");
  });

  it("Supabase only in skills → declared_skill", () => {
    const data = {
      ...baseResume,
      skills: [{ name: "React" }, { name: "Supabase" }],
      experience: [],
      projects: [],
      github: [],
    };
    const map = buildResumeEvidenceMap(data);
    const result = classifyKeywordEvidence("supabase", map);
    expect(result.status).toBe("declared_skill");
  });

  it("Supabase missing from resume → missing", () => {
    const data = {
      ...baseResume,
      skills: [{ name: "React" }],
      experience: [],
      projects: [],
      github: [],
    };
    const map = buildResumeEvidenceMap(data);
    const result = classifyKeywordEvidence("supabase", map);
    expect(result.status).toBe("missing");
  });

  it("analyzeJobMatch: Supabase in vacancy + project → confirmedProjects", () => {
    const data = {
      ...baseResume,
      experience: [],
      projects: [{ id: "1", name: "CV Builder", techStack: "React, Supabase, Vite" }],
    };
    const result = analyzeJobMatch(data, "Supabase / PostgreSQL React");
    expect(result.confirmedProjects).toContain("supabase");
    expect(result.confirmedProjects).toContain("react");
  });

  it("analyzeJobMatch: Supabase only in skills → declaredOnly", () => {
    const data = {
      ...baseResume,
      skills: [{ name: "React" }, { name: "Supabase" }],
      experience: [],
      projects: [],
      github: [],
    };
    const result = analyzeJobMatch(data, "Supabase React");
    expect(result.declaredOnly).toContain("supabase");
    expect(result.confirmedProjects).not.toContain("supabase");
  });

  it("analyzeJobMatch: Supabase missing from resume → missingEvidence", () => {
    const data = {
      ...baseResume,
      skills: [{ name: "React" }],
      experience: [],
      projects: [],
      github: [],
    };
    const result = analyzeJobMatch(data, "Supabase React");
    expect(result.missingEvidence).toContain("supabase");
  });
});

describe("Manual project guard — extractResumeText consistency", () => {
  it("techStack in manual project → found in technical matching", () => {
    const data = {
      ...baseResume,
      skills: [],
      experience: [],
      github: [],
      projects: [{ id: "1", name: "App", techStack: "Supabase, Vite" }],
    };
    const result = analyzeJobMatch(data, "Supabase Vite");
    expect(result.found).toContain("supabase");
    expect(result.found).toContain("vite");
    expect(result.missing).not.toContain("supabase");
    expect(result.missing).not.toContain("vite");
  });

  it("description in manual project → found in technical matching", () => {
    const data = {
      ...baseResume,
      skills: [],
      experience: [],
      github: [],
      projects: [{ id: "1", name: "App", description: "Built with PostgreSQL and Redis" }],
    };
    const result = analyzeJobMatch(data, "PostgreSQL Redis");
    expect(result.found).toContain("postgresql");
    expect(result.found).toContain("redis");
  });

  it("link-only project → not in found", () => {
    const data = {
      ...baseResume,
      skills: [],
      experience: [],
      github: [],
      projects: [{ id: "1", name: "App", link: "https://example.com" }],
    };
    const result = analyzeJobMatch(data, "App");
    expect(result.found).not.toContain("app");
  });

  it("name-only project → not in found", () => {
    const data = {
      ...baseResume,
      skills: [],
      experience: [],
      github: [],
      projects: [{ id: "1", name: "Supabase Project" }],
    };
    const result = analyzeJobMatch(data, "Supabase");
    expect(result.found).not.toContain("supabase");
  });

  it("empty project → not in found", () => {
    const data = {
      ...baseResume,
      skills: [],
      experience: [],
      github: [],
      projects: [{ id: "1" }],
    };
    const result = analyzeJobMatch(data, "test");
    expect(result.found).toHaveLength(0);
  });

  it("meaningful project uses name/role after guard passes", () => {
    const data = {
      ...baseResume,
      skills: [],
      experience: [],
      github: [],
      projects: [{ id: "1", name: "My App", role: "Fullstack Developer", description: "Web app", techStack: "React" }],
    };
    const result = analyzeJobMatch(data, "React");
    expect(result.found).toContain("react");
  });

  it("projects array is not mutated", () => {
    const projects = [{ id: "1", name: "App", techStack: "React" }];
    const data = { ...baseResume, projects };
    analyzeJobMatch(data, "React");
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("App");
  });
});

describe("Manual project — technicalScore sync", () => {
  it("technology only in manual project → technicalScore includes it", () => {
    const data = {
      profile: { name: "Test", email: "t@t.com", about: "" },
      skills: [],
      experience: [],
      education: [],
      github: [],
      projects: [{ id: "1", name: "App", techStack: "Supabase" }],
    };
    const result = analyzeJobMatch(data, "Supabase");
    expect(result.technicalScore).toBe(100);
    expect(result.found).toContain("supabase");
    expect(result.missing).not.toContain("supabase");
    expect(result.confirmedProjects).toContain("supabase");
    expect(result.evidenceScore).toBeGreaterThan(0);
  });

  it("manual project and skills overlap → no double count in found", () => {
    const data = {
      ...baseResume,
      experience: [],
      github: [],
      projects: [{ id: "1", name: "App", techStack: "React, TypeScript" }],
    };
    const result = analyzeJobMatch(data, "React TypeScript");
    const reactCount = result.found.filter((k) => k === "react").length;
    expect(reactCount).toBe(1);
  });
});
