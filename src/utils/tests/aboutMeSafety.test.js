import { afterEach, describe, expect, it, vi } from "vitest";
import { __aboutMeTesting, generateAboutMe } from "../aiService";

const {
  detectProfileType,
  splitSkillConfirmation,
  validateGeneratedAboutMe,
  buildFallbackText,
} = __aboutMeTesting;

const skills = [
  { name: "React", level: 4 },
  { name: "TypeScript", level: 4 },
  { name: "PostgreSQL", level: 3 },
  { name: "Supabase", level: 3 },
];

afterEach(() => {
  delete window.puter;
  vi.restoreAllMocks();
});

describe("about-me evidence scopes", () => {
  it("keeps commercial experience as the strongest evidence scope", () => {
    const profile = detectProfileType(
      "Frontend-разработчик. Разрабатывал интерфейсы на React и TypeScript.",
      "",
      skills,
      ""
    );

    expect(profile.primary).toBe("frontend");
    expect(profile.evidenceScope).toBe("commercial");
    expect(profile.hasCommercialExperience).toBe(true);
    expect(profile.commercialScores.frontend).toBeGreaterThan(0);
  });

  it("detects a fullstack profile from an informative manual project without treating it as work", () => {
    const projectText = [
      "Собственный fullstack-проект",
      "React TypeScript",
      "backend logic API PostgreSQL Supabase",
    ].join(" ");
    const profile = detectProfileType("", "", skills, projectText);
    const confirmation = splitSkillConfirmation(skills, "", "", projectText);

    expect(profile.primary).toBe("fullstack");
    expect(profile.evidenceScope).toBe("project");
    expect(profile.hasCommercialExperience).toBe(false);
    expect(confirmation.experienceConfirmed).toEqual([]);
    expect(confirmation.projectConfirmed).toEqual([
      "React",
      "TypeScript",
      "PostgreSQL",
      "Supabase",
    ]);
  });

  it("detects a frontend profile from a manual project", () => {
    const projectText = "Лендинг и SPA на React, TypeScript и Astro";
    const profile = detectProfileType("", "", skills, projectText);

    expect(profile.primary).toBe("frontend");
    expect(profile.evidenceScope).toBe("project");
    expect(profile.projectScores.frontend).toBeGreaterThan(0);
  });

  it("treats GitHub repositories as project evidence, not commercial experience", () => {
    const confirmation = splitSkillConfirmation(
      [{ name: "React", level: 4 }],
      "",
      "portfolio: React application",
      ""
    );

    expect(confirmation.experienceConfirmed).toEqual([]);
    expect(confirmation.projectConfirmed).toEqual(["React"]);
  });

  it("uses a cautious skills-only fallback when no experience or projects exist", () => {
    const profile = detectProfileType("", "", skills, "");
    const fallback = buildFallbackText("", profile, skills);

    expect(profile.primary).toBe("unknown");
    expect(profile.evidenceScope).toBe("skills_only");
    expect(fallback).toContain("заявленных навыков");
    expect(fallback).not.toContain("проектный опыт");
    expect(fallback).not.toContain("опыт работы");
  });
});

describe("about-me project wording safety", () => {
  const projectProfile = detectProfileType(
    "",
    "",
    [{ name: "React", level: 4 }],
    "Frontend-проект на React"
  );

  it("rejects work wording for a technology confirmed only by a project", () => {
    const result = validateGeneratedAboutMe(
      "Работал с React при создании интерфейса. Выполнял задачи проекта.",
      projectProfile,
      [],
      [],
      ["React"]
    );

    expect(result.ok).toBe(false);
    expect(result.violations.some((item) => item.includes("commercial-overclaim"))).toBe(true);
  });

  it("accepts explicit project wording for a project-confirmed technology", () => {
    const result = validateGeneratedAboutMe(
      "Есть проектный опыт frontend-разработки. В проектах использовал React.",
      projectProfile,
      [],
      [],
      ["React"]
    );

    expect(result).toEqual({ ok: true, violations: [] });
  });

  it("builds a project-aware fallback without commercial claims", () => {
    const projectText = "Fullstack проект: React TypeScript backend API PostgreSQL Supabase тестирование CI";
    const profile = detectProfileType("", "", skills, projectText);
    const fallback = buildFallbackText("", profile, skills, projectText);

    expect(fallback).toContain("проектный опыт fullstack-разработки");
    expect(fallback).toContain("React");
    expect(fallback).toContain("PostgreSQL");
    expect(fallback).not.toContain("Работал с");
    expect(fallback).not.toContain("опыт работы");
  });

  it("retries a project-only generation instead of immediately using the unknown fallback", async () => {
    const chat = vi.fn()
      .mockResolvedValueOnce("Работал с React и TypeScript. Создавал интерфейсы.")
      .mockResolvedValueOnce(
        "Есть проектный опыт frontend-разработки. В проектах использовал React и TypeScript."
      );
    window.puter = { ai: { chat } };

    const result = await generateAboutMe({
      name: "Тест",
      about: "",
      skills: [
        { name: "React", level: 4 },
        { name: "TypeScript", level: 4 },
      ],
      experience: [],
      github: [],
      projects: [{
        name: "Portfolio",
        description: "Frontend-приложение на React и TypeScript",
        techStack: "React, TypeScript",
      }],
    });

    expect(chat).toHaveBeenCalledTimes(2);
    expect(result).toContain("проектный опыт");
    expect(result).toContain("В проектах использовал React");
    expect(result).not.toContain("набором заявленных навыков");
  });
});