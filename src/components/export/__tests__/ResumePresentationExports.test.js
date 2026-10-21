import { describe, expect, it } from "vitest";
import { buildMarkdown } from "../ExportMarkdown";
import { buildDocxDocument } from "../ExportDocx";

function resumeData(showSkillLevels) {
  return {
    profile: { name: "Test User", location: "Тольятти", age: 22 },
    skills: [{ id: 1, name: "React", level: 4 }],
    education: [],
    experience: [],
    github: [],
    projects: [],
    showSkillLevels,
  };
}

function collectObjectStrings(value, seen = new WeakSet()) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  if (seen.has(value)) return [];
  seen.add(value);

  return Object.values(value).flatMap((child) =>
    collectObjectStrings(child, seen)
  );
}

describe("Markdown presentation settings", () => {
  it("hides only levels and includes optional age", () => {
    const markdown = buildMarkdown(resumeData(false));

    expect(markdown).toContain("22 года");
    expect(markdown).toContain("- React");
    expect(markdown).not.toContain("React — 4/5");
  });

  it("shows levels when enabled", () => {
    expect(buildMarkdown(resumeData(true))).toContain("React — 4/5");
  });
});

describe("DOCX presentation settings", () => {
  it("hides only levels and includes optional age", () => {
    const text = collectObjectStrings(buildDocxDocument(resumeData(false))).join(
      " "
    );

    expect(text).toContain("22 года");
    expect(text).toContain("React");
    expect(text).not.toContain("React — 4/5");
  });

  it("shows levels when enabled", () => {
    const text = collectObjectStrings(buildDocxDocument(resumeData(true))).join(
      " "
    );
    expect(text).toContain("React — 4/5");
  });
});
