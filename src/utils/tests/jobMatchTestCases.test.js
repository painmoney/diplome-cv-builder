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

  it("manual project cases include projects array", () => {
    const projectCases = JOB_MATCH_TEST_CASES.filter((c) => c.id === "manual-project" || c.id === "mixed-portfolio");
    for (const tc of projectCases) {
      expect(Array.isArray(tc.resumeData.projects)).toBe(true);
      expect(tc.resumeData.projects.length).toBeGreaterThan(0);
    }
  });
});

describe("Case A — Work experience", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "work-experience");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns ai", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 75,
      technicalScore: 80,
      confirmedExperience: ["react", "typescript", "rest api"],
      confirmedProjects: [],
      declaredOnly: [],
      missingEvidence: [],
    });
    expect(mode.mode).toBe("ai");
  });

  it("experience is confirmed in resume", () => {
    expect(tc.resumeData.experience.length).toBeGreaterThan(0);
    const expDesc = tc.resumeData.experience.map((e) => e.description).join(" ");
    expect(expDesc.toLowerCase()).toContain("react");
    expect(expDesc.toLowerCase()).toContain("typescript");
  });
});

describe("Case B — GitHub evidence", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "github-evidence");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns careful", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 50,
      technicalScore: 60,
      confirmedExperience: [],
      confirmedProjects: ["typescript", "node.js"],
      declaredOnly: [],
      missingEvidence: [],
    });
    expect(mode.mode).toBe("careful");
  });

  it("has no experience", () => {
    expect(tc.resumeData.experience).toHaveLength(0);
  });

  it("has GitHub repos with relevant tech", () => {
    expect(tc.resumeData.github.length).toBeGreaterThan(0);
    const ghDesc = tc.resumeData.github.map((g) => `${g.description} ${g.name}`).join(" ");
    expect(ghDesc.toLowerCase()).toContain("typescript");
    expect(ghDesc.toLowerCase()).toContain("node");
  });
});

describe("Case C — Manual project", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "manual-project");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns careful", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 45,
      technicalScore: 55,
      confirmedExperience: [],
      confirmedProjects: ["react", "supabase", "vite"],
      declaredOnly: [],
      missingEvidence: [],
    });
    expect(mode.mode).toBe("careful");
  });

  it("has no experience", () => {
    expect(tc.resumeData.experience).toHaveLength(0);
  });

  it("has no GitHub", () => {
    expect(tc.resumeData.github).toHaveLength(0);
  });

  it("has meaningful projects with techStack", () => {
    expect(tc.resumeData.projects.length).toBeGreaterThan(0);
    const hasTechStack = tc.resumeData.projects.some((p) => p.techStack && p.techStack.length > 0);
    expect(hasTechStack).toBe(true);
  });

  it("project techStack contains relevant technologies", () => {
    const allTech = tc.resumeData.projects.map((p) => p.techStack || "").join(" ").toLowerCase();
    expect(allTech).toContain("react");
    expect(allTech).toContain("supabase");
  });
});

describe("Case D — Skills only", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "skills-only");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns careful", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 35,
      technicalScore: 40,
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: ["docker", "kubernetes", "ci/cd"],
      missingEvidence: ["terraform"],
    });
    expect(mode.mode).toBe("careful");
  });

  it("skills-only technologies are not in experience description", () => {
    const expDesc = tc.resumeData.experience.map((e) => e.description).join(" ").toLowerCase();
    expect(expDesc).not.toContain("docker");
    expect(expDesc).not.toContain("kubernetes");
  });
});

describe("Case E — Missing evidence", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "missing-evidence");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns careful", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 30,
      technicalScore: 35,
      confirmedExperience: [],
      confirmedProjects: [],
      declaredOnly: [],
      missingEvidence: ["kubernetes", "terraform", "aws"],
    });
    expect(mode.mode).toBe("careful");
  });

  it("resume does not contain missing technologies", () => {
    const allResumeText = [
      ...tc.resumeData.skills.map((s) => s.name),
      ...tc.resumeData.experience.map((e) => e.description),
      ...tc.resumeData.github.map((g) => `${g.description} ${g.name}`),
    ].join(" ").toLowerCase();
    expect(allResumeText).not.toContain("kubernetes");
    expect(allResumeText).not.toContain("terraform");
    expect(allResumeText).not.toContain("aws");
  });
});

describe("Case F — Mixed portfolio", () => {
  const tc = JOB_MATCH_TEST_CASES.find((c) => c.id === "mixed-portfolio");

  it("exists", () => {
    expect(tc).toBeTruthy();
  });

  it("getCoverLetterMode returns ai", () => {
    const mode = getCoverLetterMode({
      evidenceScore: 65,
      technicalScore: 70,
      confirmedExperience: ["react"],
      confirmedProjects: ["typescript", "supabase", "node.js"],
      declaredOnly: [],
      missingEvidence: [],
    });
    expect(mode.mode).toBe("ai");
  });

  it("has experience with React", () => {
    expect(tc.resumeData.experience.length).toBeGreaterThan(0);
    const expDesc = tc.resumeData.experience.map((e) => e.description).join(" ");
    expect(expDesc.toLowerCase()).toContain("react");
  });

  it("has manual projects with Supabase/TypeScript", () => {
    expect(tc.resumeData.projects.length).toBeGreaterThan(0);
    const allProjectTech = tc.resumeData.projects.map((p) => p.techStack || "").join(" ").toLowerCase();
    expect(allProjectTech).toContain("supabase");
    expect(allProjectTech).toContain("typescript");
  });

  it("has GitHub with TypeScript/Node.js", () => {
    expect(tc.resumeData.github.length).toBeGreaterThan(0);
    const ghDesc = tc.resumeData.github.map((g) => `${g.description} ${g.name}`).join(" ");
    expect(ghDesc.toLowerCase()).toContain("typescript");
    expect(ghDesc.toLowerCase()).toContain("node");
  });
});

describe("keyword extraction", () => {
  it("extracts keywords from job description", () => {
    const keywords = extractKeywordsFromText("React JavaScript TypeScript REST API");
    expect(keywords).toContain("react");
    expect(keywords).toContain("javascript");
    expect(keywords).toContain("typescript");
    expect(keywords).toContain("rest api");
  });

  it("'REST services' matches REST API", () => {
    expect(extractKeywordsFromText("REST services")).toContain("rest api");
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

describe("extractKeywordsFromText — Stage C-3a safe multi-word baseline", () => {
  it("detects Testing Library", () => {
    const result = extractKeywordsFromText("We use Testing Library for component tests");
    expect(result).toContain("testing library");
  });

  it("detects Docker Compose", () => {
    const result = extractKeywordsFromText("Docker Compose for local dev");
    expect(result).toContain("docker compose");
  });

  it("detects GitHub Actions", () => {
    const result = extractKeywordsFromText("CI via GitHub Actions");
    expect(result).toContain("github actions");
  });

  it("detects GitLab CI", () => {
    const result = extractKeywordsFromText("Pipeline in GitLab CI");
    expect(result).toContain("gitlab ci");
  });

  it("detects REST API", () => {
    const result = extractKeywordsFromText("REST API integration");
    expect(result).toContain("rest api");
  });

  it("detects Spring Boot", () => {
    const result = extractKeywordsFromText("Backend with Spring Boot");
    expect(result).toContain("spring boot");
  });

  it("detects MS SQL Server", () => {
    const result = extractKeywordsFromText("Database: MS SQL Server");
    expect(result).toContain("ms sql server");
  });
});

describe("extractKeywordsFromText — Stage C-3a docker-compose synonym", () => {
  it("docker-compose maps to docker compose via SYNONYMS", () => {
    const result = extractKeywordsFromText("Local environment uses docker-compose");
    expect(result).toContain("docker compose");
  });

  it("docker-compose in config context maps to docker compose", () => {
    const result = extractKeywordsFromText("docker-compose configuration for services");
    expect(result).toContain("docker compose");
  });
});

describe("extractKeywordsFromText — Stage C-3a registry-only aliases NOT in recognition", () => {
  it("'vanilla js' does NOT contain javascript", () => {
    const result = extractKeywordsFromText("vanilla js");
    expect(result).not.toContain("javascript");
  });

  it("'ts files' does NOT contain typescript", () => {
    const result = extractKeywordsFromText("ts files");
    expect(result).not.toContain("typescript");
  });

  it("'rn app' does NOT contain react native", () => {
    const result = extractKeywordsFromText("rn app");
    expect(result).not.toContain("react native");
  });
});

describe("extractKeywordsFromText — Stage C-3b false-positive prevention", () => {
  it("'go to production' does NOT match Go", () => {
    expect(extractKeywordsFromText("go to production and deploy")).not.toContain("go");
  });

  it("'go live next week' does NOT match Go", () => {
    expect(extractKeywordsFromText("go live next week")).not.toContain("go");
  });

  it("'go ahead with deployment' does NOT match Go", () => {
    expect(extractKeywordsFromText("go ahead with deployment")).not.toContain("go");
  });

  it("'rest of the team' does NOT match REST API", () => {
    expect(extractKeywordsFromText("rest of the team works on frontend")).not.toContain("rest api");
  });

  it("'rest assured' does NOT match REST API", () => {
    expect(extractKeywordsFromText("rest assured, documentation is ready")).not.toContain("rest api");
  });

  it("'take a rest' does NOT match REST API", () => {
    expect(extractKeywordsFromText("take a rest after release")).not.toContain("rest api");
  });

  it("'node in a graph' does NOT match Node.js", () => {
    expect(extractKeywordsFromText("each node in the graph has neighbors")).not.toContain("node.js");
  });

  it("'tree node traversal' does NOT match Node.js", () => {
    expect(extractKeywordsFromText("tree node traversal")).not.toContain("node.js");
  });

  it("'network node' does NOT match Node.js", () => {
    expect(extractKeywordsFromText("network node is unavailable")).not.toContain("node.js");
  });

  it("'R&D department' does NOT match R", () => {
    expect(extractKeywordsFromText("R&D department")).not.toContain("r");
  });

  it("'option r' does NOT match R", () => {
    expect(extractKeywordsFromText("option r is selected")).not.toContain("r");
  });

  it("'grade R' does NOT match R", () => {
    expect(extractKeywordsFromText("grade R is required")).not.toContain("r");
  });
});

describe("extractKeywordsFromText — Stage C-3b true-positive via explicit patterns", () => {
  it("'Go programming language' matches Go", () => {
    expect(extractKeywordsFromText("Go programming language")).toContain("go");
  });

  it("'backend with Go' matches Go", () => {
    expect(extractKeywordsFromText("backend with Go")).toContain("go");
  });

  it("'Golang backend service' matches Go", () => {
    expect(extractKeywordsFromText("Golang backend service")).toContain("go");
  });

  it("'Go developer role' matches Go", () => {
    expect(extractKeywordsFromText("Go developer role")).toContain("go");
  });

  it("'R programming for data analysis' matches R", () => {
    expect(extractKeywordsFromText("R programming for data analysis")).toContain("r");
  });

  it("'data analysis with R' matches R", () => {
    expect(extractKeywordsFromText("data analysis with R")).toContain("r");
  });

  it("'R language for analytics' matches R", () => {
    expect(extractKeywordsFromText("R language for analytics")).toContain("r");
  });

  it("'Node.js server' matches Node.js", () => {
    expect(extractKeywordsFromText("Node.js server")).toContain("node.js");
  });

  it("'NodeJS backend' matches Node.js", () => {
    expect(extractKeywordsFromText("NodeJS backend")).toContain("node.js");
  });

  it("'Node backend API' matches Node.js", () => {
    expect(extractKeywordsFromText("Node backend API")).toContain("node.js");
  });

  it("'Node server with Express' matches Node.js", () => {
    expect(extractKeywordsFromText("Node server with Express")).toContain("node.js");
  });

  it("'REST API integration' matches REST API", () => {
    expect(extractKeywordsFromText("REST API integration")).toContain("rest api");
  });

  it("'RESTful API endpoints' matches REST API", () => {
    expect(extractKeywordsFromText("RESTful API endpoints")).toContain("rest api");
  });

  it("'REST endpoints' matches REST API", () => {
    expect(extractKeywordsFromText("REST endpoints")).toContain("rest api");
  });

  it("'REST services' matches REST API", () => {
    expect(extractKeywordsFromText("REST services")).toContain("rest api");
  });
});
