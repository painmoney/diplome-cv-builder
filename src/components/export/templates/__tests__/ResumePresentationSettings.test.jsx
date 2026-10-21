import React from "react";
import { describe, expect, it } from "vitest";
import MinimalistPDF from "../MinimalistPDF";
import AcademicPDF from "../AcademicPDF";
import GithubPDF from "../GithubPDF";
import ClassicPDF from "../ClassicPDF";
import ModernPDF from "../ModernPDF";

const templates = [
  ["MinimalistPDF", MinimalistPDF, "React — 4/5"],
  ["AcademicPDF", AcademicPDF, "React — 4/5"],
  ["GithubPDF", GithubPDF, "React — 4/5"],
  ["ClassicPDF", ClassicPDF, "React (4/5)"],
  ["ModernPDF", ModernPDF, "React (4)"],
];

function collectText(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (React.isValidElement(node)) return collectText(node.props.children);
  return "";
}

function resumeData(overrides = {}) {
  return {
    profile: { name: "Test User", location: "Тольятти", age: 22 },
    skills: [{ id: 1, name: "React", level: 4 }],
    education: [],
    experience: [],
    github: [],
    projects: [],
    ...overrides,
  };
}

describe.each(templates)("%s presentation settings", (_, Template, levelText) => {
  it("defaults legacy resumes to visible skill levels", () => {
    expect(collectText(Template({ data: resumeData() }))).toContain(levelText);
  });

  it("shows skill levels when explicitly enabled", () => {
    expect(
      collectText(
        Template({ data: resumeData({ showSkillLevels: true }) })
      )
    ).toContain(levelText);
  });

  it("hides the level but preserves the skill name", () => {
    const text = collectText(
      Template({ data: resumeData({ showSkillLevels: false }) })
    );

    expect(text).toContain("React");
    expect(text).not.toContain(levelText);
  });

  it("includes optional formatted age only when present", () => {
    expect(collectText(Template({ data: resumeData() }))).toContain("22 года");
    expect(
      collectText(
        Template({
          data: resumeData({ profile: { name: "Test User" } }),
        })
      )
    ).not.toContain("22 года");
  });
});
