import { describe, it, expect } from "vitest";
import {
  TECHNOLOGY_REGISTRY,
  TECHNOLOGY_KEYS,
  TECHNOLOGY_DISPLAY_NAMES,
  TECHNOLOGY_ALIASES,
  normalizeTechnologyKey,
  getTechnologyMeta,
  getTechnologyDisplayName,
  getTechnologyCategory,
  getTechnologyTipType,
} from "../technologyRegistry";

describe("TECHNOLOGY_REGISTRY structure", () => {
  it("every entry has displayName", () => {
    for (const tech of Object.values(TECHNOLOGY_REGISTRY)) {
      expect(tech.displayName).toBeTruthy();
      expect(typeof tech.displayName).toBe("string");
      expect(tech.displayName.length).toBeGreaterThan(0);
    }
  });

  it("every entry has category", () => {
    const validCategories = ["languages", "frameworks", "databases", "cloud", "tools", "methodologies"];
    for (const tech of Object.values(TECHNOLOGY_REGISTRY)) {
      expect(validCategories).toContain(tech.category);
    }
  });

  it("every entry has tipType", () => {
    const validTipTypes = [
      "programming-language", "frontend-framework", "backend-framework",
      "database", "devops-tool", "cloud-platform", "testing-tool",
      "api-protocol", "version-control", "build-tool", "mobile-framework",
      "data-ml", "message-broker", "architecture", "methodology", "generic",
    ];
    for (const tech of Object.values(TECHNOLOGY_REGISTRY)) {
      expect(validTipTypes).toContain(tech.tipType);
    }
  });

  it("aliases is an array", () => {
    for (const tech of Object.values(TECHNOLOGY_REGISTRY)) {
      expect(Array.isArray(tech.aliases)).toBe(true);
    }
  });

  it("no Chinese artifacts in display names", () => {
    const forbidden = ["原因", "映射", "个工作"];
    for (const tech of Object.values(TECHNOLOGY_REGISTRY)) {
      for (const pattern of forbidden) {
        expect(tech.displayName).not.toContain(pattern);
      }
    }
  });
});

describe("aliases", () => {
  it("aliases are unique across registry", () => {
    const seen = new Map();
    for (const [key, tech] of Object.entries(TECHNOLOGY_REGISTRY)) {
      for (const alias of (tech.aliases || [])) {
        expect(seen.has(alias)).toBe(false);
        seen.set(alias, key);
      }
    }
  });

  it("aliases do not collide with canonical keys", () => {
    for (const tech of Object.values(TECHNOLOGY_REGISTRY)) {
      for (const alias of (tech.aliases || [])) {
        expect(TECHNOLOGY_REGISTRY[alias]).toBeUndefined();
      }
    }
  });

  it("aliases are lowercase", () => {
    for (const tech of Object.values(TECHNOLOGY_REGISTRY)) {
      for (const alias of (tech.aliases || [])) {
        expect(alias).toBe(alias.toLowerCase());
      }
    }
  });
});

describe("normalizeTechnologyKey", () => {
  it("returns canonical key for direct match", () => {
    expect(normalizeTechnologyKey("react")).toBe("react");
    expect(normalizeTechnologyKey("postgresql")).toBe("postgresql");
  });

  it("resolves aliases", () => {
    expect(normalizeTechnologyKey("reactjs")).toBe("react");
    expect(normalizeTechnologyKey("react.js")).toBe("react");
    expect(normalizeTechnologyKey("postgres")).toBe("postgresql");
    expect(normalizeTechnologyKey("nodejs")).toBe("node.js");
    expect(normalizeTechnologyKey("node")).toBe("node.js");
    expect(normalizeTechnologyKey("ts")).toBe("typescript");
    expect(normalizeTechnologyKey("js")).toBe("javascript");
    expect(normalizeTechnologyKey("restful")).toBe("rest api");
    expect(normalizeTechnologyKey("rest")).toBe("rest api");
    expect(normalizeTechnologyKey("k8s")).toBe("kubernetes");
    expect(normalizeTechnologyKey("csharp")).toBe("c#");
    expect(normalizeTechnologyKey("mongo")).toBe("mongodb");
    expect(normalizeTechnologyKey("nextjs")).toBe("next.js");
    expect(normalizeTechnologyKey("nuxtjs")).toBe("nuxt.js");
    expect(normalizeTechnologyKey("mssql")).toBe("ms sql server");
    expect(normalizeTechnologyKey("sql server")).toBe("ms sql server");
    expect(normalizeTechnologyKey("tailwindcss")).toBe("tailwind");
    expect(normalizeTechnologyKey("tailwind css")).toBe("tailwind");
  });

  it("returns null for unknown", () => {
    expect(normalizeTechnologyKey("unknown")).toBeNull();
    expect(normalizeTechnologyKey("")).toBeNull();
    expect(normalizeTechnologyKey(null)).toBeNull();
  });
});

describe("getTechnologyMeta", () => {
  it("returns meta for known key", () => {
    const meta = getTechnologyMeta("react");
    expect(meta).toBeTruthy();
    expect(meta.displayName).toBe("React");
    expect(meta.category).toBe("frameworks");
  });

  it("returns meta for alias", () => {
    const meta = getTechnologyMeta("reactjs");
    expect(meta).toBeTruthy();
    expect(meta.displayName).toBe("React");
  });

  it("returns null for unknown", () => {
    expect(getTechnologyMeta("unknown")).toBeNull();
  });
});

describe("getTechnologyDisplayName", () => {
  it("returns correct display names for problem technologies", () => {
    expect(getTechnologyDisplayName("testing")).toBe("Testing");
    expect(getTechnologyDisplayName("rest api")).toBe("REST API");
    expect(getTechnologyDisplayName("github actions")).toBe("GitHub Actions");
    expect(getTechnologyDisplayName("gitlab ci")).toBe("GitLab CI");
    expect(getTechnologyDisplayName("vs code")).toBe("VS Code");
    expect(getTechnologyDisplayName("ms sql server")).toBe("MS SQL Server");
    expect(getTechnologyDisplayName("styled components")).toBe("Styled Components");
    expect(getTechnologyDisplayName("spring boot")).toBe("Spring Boot");
    expect(getTechnologyDisplayName("node.js")).toBe("Node.js");
    expect(getTechnologyDisplayName("next.js")).toBe("Next.js");
    expect(getTechnologyDisplayName("nuxt.js")).toBe("Nuxt.js");
    expect(getTechnologyDisplayName("c++")).toBe("C++");
    expect(getTechnologyDisplayName("c#")).toBe("C#");
    expect(getTechnologyDisplayName("grpc")).toBe("gRPC");
    expect(getTechnologyDisplayName("jwt")).toBe("JWT");
    expect(getTechnologyDisplayName("oauth")).toBe("OAuth");
    expect(getTechnologyDisplayName("html")).toBe("HTML");
    expect(getTechnologyDisplayName("css")).toBe("CSS");
    expect(getTechnologyDisplayName("scss")).toBe("SCSS");
    expect(getTechnologyDisplayName("sass")).toBe("Sass");
    expect(getTechnologyDisplayName("mui")).toBe("MUI");
    expect(getTechnologyDisplayName("jpa")).toBe("JPA");
    expect(getTechnologyDisplayName("jvm")).toBe("JVM");
    expect(getTechnologyDisplayName("gc")).toBe("GC");
    expect(getTechnologyDisplayName("sql")).toBe("SQL");
    expect(getTechnologyDisplayName("nosql")).toBe("NoSQL");
    expect(getTechnologyDisplayName("aws")).toBe("AWS");
    expect(getTechnologyDisplayName("gcp")).toBe("GCP");
    expect(getTechnologyDisplayName("ci/cd")).toBe("CI/CD");
    expect(getTechnologyDisplayName("npm")).toBe("npm");
    expect(getTechnologyDisplayName("pnpm")).toBe("pnpm");
    expect(getTechnologyDisplayName("yarn")).toBe("yarn");
    expect(getTechnologyDisplayName("supabase")).toBe("Supabase");
  });

  it("returns safe fallback for unknown", () => {
    expect(getTechnologyDisplayName("unknown")).toBe("Unknown");
    expect(getTechnologyDisplayName("")).toBe("");
  });
});

describe("getTechnologyCategory", () => {
  it("returns category for known key", () => {
    expect(getTechnologyCategory("react")).toBe("frameworks");
    expect(getTechnologyCategory("postgresql")).toBe("databases");
    expect(getTechnologyCategory("docker")).toBe("cloud");
    expect(getTechnologyCategory("supabase")).toBe("databases");
  });

  it("returns null for unknown", () => {
    expect(getTechnologyCategory("unknown")).toBeNull();
  });
});

describe("getTechnologyTipType", () => {
  it("returns non-empty tipType for every key", () => {
    for (const key of TECHNOLOGY_KEYS) {
      const tipType = getTechnologyTipType(key);
      expect(tipType).toBeTruthy();
      expect(tipType.length).toBeGreaterThan(0);
    }
  });

  it("returns generic for unknown", () => {
    expect(getTechnologyTipType("unknown")).toBe("generic");
  });
});

describe("compatibility exports", () => {
  it("TECHNOLOGY_DISPLAY_NAMES has entries for all keys", () => {
    for (const key of TECHNOLOGY_KEYS) {
      expect(TECHNOLOGY_DISPLAY_NAMES[key]).toBeTruthy();
    }
  });

  it("TECHNOLOGY_ALIASES maps alias to canonical key", () => {
    expect(TECHNOLOGY_ALIASES["reactjs"]).toBe("react");
    expect(TECHNOLOGY_ALIASES["postgres"]).toBe("postgresql");
    expect(TECHNOLOGY_ALIASES["nodejs"]).toBe("node.js");
  });
});

describe("registry count", () => {
  it("has at least 111 entries", () => {
    expect(TECHNOLOGY_KEYS.length).toBeGreaterThanOrEqual(111);
  });
});
