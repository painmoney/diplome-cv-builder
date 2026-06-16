import { describe, it, expect } from "vitest";
import {
  normalizeTelegram,
  normalizeUrl,
  normalizeResumeData,
  buildProfileContactLinks,
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
      telegram: "@user",
      githubUrl: "https://github.com/u",
      linkedin: "https://linkedin.com/in/u",
      website: "https://site.com",
      habrCareer: "https://career.habr.com/u",
    };
    const links = buildProfileContactLinks(profile);
    expect(links.length).toBe(8);
    expect(links.map((l) => l.type)).toEqual([
      "email", "phone", "location", "telegram", "github", "linkedin", "website", "habrCareer",
    ]);
  });
});
