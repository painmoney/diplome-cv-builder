import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import MinimalistTemplate from "../MinimalistTemplate";
import AcademicTemplate from "../AcademicTemplate";
import GithubTemplate from "../GithubTemplate";
import ClassicTemplate from "../ClassicTemplate";
import ModernTemplate from "../ModernTemplate";

const templates = [
  ["MinimalistTemplate", MinimalistTemplate, "React — 4/5"],
  ["AcademicTemplate", AcademicTemplate, "React — 4/5"],
  ["GithubTemplate", GithubTemplate, "React 4/5"],
  ["ClassicTemplate", ClassicTemplate, "React (4/5)"],
  ["ModernTemplate", ModernTemplate, "React (4)"],
];

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

afterEach(cleanup);

describe.each(templates)("%s presentation settings", (_, Template, levelText) => {
  it("shows skill levels for legacy resumes without the setting", () => {
    const { container } = render(<Template data={resumeData()} />);
    expect(container).toHaveTextContent(levelText);
  });

  it("shows skill levels when explicitly enabled", () => {
    const { container } = render(
      <Template data={resumeData({ showSkillLevels: true })} />
    );
    expect(container).toHaveTextContent(levelText);
  });

  it("hides only the level when disabled", () => {
    const { container } = render(
      <Template data={resumeData({ showSkillLevels: false })} />
    );
    expect(container).toHaveTextContent("React");
    expect(container).not.toHaveTextContent(levelText);
  });

  it("shows formatted age without empty metadata artifacts", () => {
    const withAge = render(<Template data={resumeData()} />);
    expect(withAge.container).toHaveTextContent("22 года");
    cleanup();

    const withoutAge = render(
      <Template data={resumeData({ profile: { name: "Test User" } })} />
    );
    expect(withoutAge.container).not.toHaveTextContent("22 года");
  });
});
