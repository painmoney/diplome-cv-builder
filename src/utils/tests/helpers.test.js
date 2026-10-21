import { describe, it, expect } from "vitest";
import {
  normalizeTelegram,
  normalizeUrl,
  normalizeResumeData,
  buildProfileContactLinks,
  getResumeCompleteness,
  formatAge,
  getVisibleSkillLevel,
} from "../helpers";

describe("normalizeTelegram", () => {
  it("converts username to @username with URL", () => {
    const result = normalizeTelegram("username");
    expect(result.display).toBe("@username");
    expect(result.url).toBe("https://t.me/username");
  });

  it("handles @username", () => {
    const result = normalizeTelegram("@username");
    expect(result.display).toBe("@username");
    expect(result.url).toBe("https://t.me/username");
  });

  it("handles https://t.me/username", () => {
    const result = normalizeTelegram("https://t.me/username");
    expect(result.display).toBe("@username");
    expect(result.url).toBe("https://t.me/username");
  });

  it("handles t.me/username", () => {
    const result = normalizeTelegram("t.me/username");
    expect(result.display).toBe("@username");
    expect(result.url).toBe("https://t.me/username");
  });

  it("handles empty value", () => {
    const result = normalizeTelegram("");
    expect(result.display).toBe("");
    expect(result.url).toBe("");
  });

  it("handles null", () => {
    const result = normalizeTelegram(null);
    expect(result.display).toBe("");
    expect(result.url).toBe("");
  });

  it("preserves invalid input as-is", () => {
    const result = normalizeTelegram("not a telegram");
    expect(result.display).toBe("not a telegram");
    expect(result.url).toBe("not a telegram");
  });
});

describe("normalizeUrl", () => {
  it("returns empty for empty input", () => {
    expect(normalizeUrl("")).toBe("");
  });

  it("returns empty for null", () => {
    expect(normalizeUrl(null)).toBe("");
  });

  it("adds https:// to bare domains", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
    expect(normalizeUrl("portfolio.example.com")).toBe("https://portfolio.example.com");
  });

  it("preserves https URLs", () => {
    expect(normalizeUrl("https://github.com/user")).toBe("https://github.com/user");
  });

  it("preserves http URLs", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("returns raw value for unusual input", () => {
    expect(normalizeUrl("just text")).toBe("just text");
  });
});

describe("normalizeResumeData - new contact fields", () => {
  it("old profile without new fields gets defaults", () => {
    const oldData = {
      profile: { name: "Test", email: "test@test.com", phone: "+79001234567" },
    };
    const result = normalizeResumeData(oldData);
    expect(result.profile.location).toBe("");
    expect(result.profile.githubUrl).toBe("");
    expect(result.profile.website).toBe("");
    expect(result.profile.telegram).toBe("");
    expect(result.profile.linkedin).toBe("");
    expect(result.profile.habrCareer).toBe("");
    expect(result.profile.age).toBe("");
    expect(result.showSkillLevels).toBe(true);
  });

  it("preserves existing githubUrl and website", () => {
    const data = {
      profile: {
        name: "Test",
        githubUrl: "https://github.com/test",
        website: "https://test.com",
      },
    };
    const result = normalizeResumeData(data);
    expect(result.profile.githubUrl).toBe("https://github.com/test");
    expect(result.profile.website).toBe("https://test.com");
  });

  it("does not overwrite existing new fields", () => {
    const data = {
      profile: {
        name: "Test",
        telegram: "@myuser",
        linkedin: "https://linkedin.com/in/test",
        habrCareer: "https://career.habr.com/test",
      },
    };
    const result = normalizeResumeData(data);
    expect(result.profile.telegram).toBe("@myuser");
    expect(result.profile.linkedin).toBe("https://linkedin.com/in/test");
    expect(result.profile.habrCareer).toBe("https://career.habr.com/test");
  });

  it("preserves valid age and explicit skill-level visibility", () => {
    const result = normalizeResumeData({
      profile: { age: 22 },
      showSkillLevels: false,
    });

    expect(result.profile.age).toBe(22);
    expect(result.showSkillLevels).toBe(false);
  });
});

describe("skill level visibility", () => {
  const skill = { name: "React", level: 4 };

  it("shows levels by default and when explicitly enabled", () => {
    expect(getVisibleSkillLevel(skill)).toBe(4);
    expect(getVisibleSkillLevel(skill, true)).toBe(4);
  });

  it("hides only the displayed level without mutating the skill", () => {
    expect(getVisibleSkillLevel(skill, false)).toBeNull();
    expect(skill).toEqual({ name: "React", level: 4 });
  });
});

describe("formatAge", () => {
  it.each([
    [21, "21 год"],
    [22, "22 года"],
    [25, "25 лет"],
    [31, "31 год"],
    [32, "32 года"],
    [35, "35 лет"],
    [111, "111 лет"],
  ])("formats %i as %s", (age, expected) => {
    expect(formatAge(age)).toBe(expected);
  });

  it("returns empty text for a missing age", () => {
    expect(formatAge("")).toBe("");
    expect(formatAge(undefined)).toBe("");
  });
});

describe("buildProfileContactLinks", () => {
  it("returns only filled fields", () => {
    const profile = { email: "test@test.com", phone: "+79001234567" };
    const links = buildProfileContactLinks(profile);
    expect(links.length).toBe(2);
    expect(links[0].type).toBe("email");
    expect(links[1].type).toBe("phone");
  });

  it("returns empty array for empty profile", () => {
    const links = buildProfileContactLinks({});
    expect(links.length).toBe(0);
  });

  it("normalizes Telegram display", () => {
    const links = buildProfileContactLinks({ telegram: "username" });
    expect(links.length).toBe(1);
    expect(links[0].type).toBe("telegram");
    expect(links[0].value).toBe("@username");
    expect(links[0].href).toBe("https://t.me/username");
  });

  it("strips https from display values", () => {
    const links = buildProfileContactLinks({ githubUrl: "https://github.com/user" });
    expect(links[0].value).toBe("github.com/user");
    expect(links[0].href).toBe("https://github.com/user");
  });

  it("website uses Портфолио label", () => {
    const links = buildProfileContactLinks({ website: "https://portfolio.com" });
    expect(links[0].type).toBe("website");
    expect(links[0].label).toBe("Портфолио");
  });

  it("handles all contact fields", () => {
    const profile = {
      email: "a@b.com",
      phone: "+7900",
      location: "Moscow",
      age: 22,
      telegram: "@user",
      githubUrl: "https://github.com/u",
      linkedin: "https://linkedin.com/in/u",
      website: "https://site.com",
      habrCareer: "https://career.habr.com/u",
    };
    const links = buildProfileContactLinks(profile);
    expect(links.length).toBe(9);
    expect(links.map((l) => l.type)).toEqual([
      "email", "phone", "location", "age", "telegram", "github", "linkedin", "website", "habrCareer",
    ]);
    expect(links.find((link) => link.type === "age")?.value).toBe("22 года");
  });
});

describe("getResumeCompleteness - portfolio section", () => {
  const baseData = {
    profile: { name: "Test", email: "a@b.com", phone: "+7", about: "О себе тест текст для двенадцати слов минимум тут нужно больше" },
    skills: [{ name: "React" }, { name: "Node.js" }, { name: "TypeScript" }],
    experience: [{ company: "Co", position: "Dev", description: "Work" }],
    education: [{ institution: "Uni" }],
  };

  it("github only => portfolio completed", () => {
    const data = { ...baseData, github: [{ name: "repo1", url: "u" }], projects: [] };
    const result = getResumeCompleteness(data);
    const portfolio = result.sections.find((s) => s.key === "portfolio");
    expect(portfolio.completed).toBe(true);
  });

  it("manual projects only => portfolio completed", () => {
    const data = { ...baseData, github: [], projects: [{ id: "1", name: "My App", description: "A web app" }] };
    const result = getResumeCompleteness(data);
    const portfolio = result.sections.find((s) => s.key === "portfolio");
    expect(portfolio.completed).toBe(true);
  });

  it("both github and projects => portfolio completed", () => {
    const data = { ...baseData, github: [{ name: "r" }], projects: [{ id: "1", name: "P" }] };
    const result = getResumeCompleteness(data);
    const portfolio = result.sections.find((s) => s.key === "portfolio");
    expect(portfolio.completed).toBe(true);
  });

  it("no github and no projects => portfolio not completed", () => {
    const data = { ...baseData, github: [], projects: [] };
    const result = getResumeCompleteness(data);
    const portfolio = result.sections.find((s) => s.key === "portfolio");
    expect(portfolio.completed).toBe(false);
  });

  it("empty project object (no name, no description) => not counted", () => {
    const data = { ...baseData, github: [], projects: [{ id: "1" }] };
    const result = getResumeCompleteness(data);
    const portfolio = result.sections.find((s) => s.key === "portfolio");
    expect(portfolio.completed).toBe(false);
  });

  it("missing projects key => portfolio not completed", () => {
    const data = { ...baseData, github: [], projects: undefined };
    const result = getResumeCompleteness(data);
    const portfolio = result.sections.find((s) => s.key === "portfolio");
    expect(portfolio.completed).toBe(false);
  });
});
