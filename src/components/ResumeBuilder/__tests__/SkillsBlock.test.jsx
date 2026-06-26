import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SkillsBlock from "../SkillsBlock";

const mockOnChange = vi.fn();

function renderSkills(data = [], onChange = mockOnChange) {
  return render(<SkillsBlock data={data} onChange={onChange} />);
}

function getAddButton() {
  const btns = screen.getAllByRole("button", { name: /Добавить/ });
  return btns.find((b) => b.textContent.trim() === "Добавить");
}

describe("SkillsBlock form validation", () => {
  it("empty skill shows inline error", () => {
    renderSkills();
    fireEvent.click(getAddButton());
    expect(screen.getByText("Введите название навыка")).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("empty skill does not trigger autosave", () => {
    renderSkills();
    fireEvent.click(getAddButton());
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("valid submit adds skill", () => {
    renderSkills();
    fireEvent.change(screen.getByLabelText("Навык"), { target: { value: "React" } });
    fireEvent.click(getAddButton());
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "React" })])
    );
  });

  it("error clears when user types", () => {
    renderSkills();
    fireEvent.click(getAddButton());
    expect(screen.getByText("Введите название навыка")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Навык"), { target: { value: "R" } });
    expect(screen.queryByText("Введите название навыка")).not.toBeInTheDocument();
  });
});
