import { afterEach, describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import SkillsBlock from "../SkillsBlock";

vi.mock("framer-motion", () => ({
  Reorder: {
    Group: ({ children, values, onReorder }) => (
      <div>
        <button
          type="button"
          aria-label="Сымитировать изменение порядка навыков"
          onClick={() =>
            onReorder([
              values[0],
              values[values.length - 1],
              ...values.slice(1, -1),
            ])
          }
        >
          Изменить порядок
        </button>
        {children}
      </div>
    ),
    Item: ({ children }) => <div>{children}</div>,
  },
  useDragControls: () => ({ start: () => {} }),
}));

const mockOnChange = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderSkills(
  data = [],
  onChange = mockOnChange,
  showSkillLevels = true,
  onShowSkillLevelsChange = vi.fn()
) {
  return render(
    <SkillsBlock
      data={data}
      onChange={onChange}
      showSkillLevels={showSkillLevels}
      onShowSkillLevelsChange={onShowSkillLevelsChange}
    />
  );
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

describe("SkillsBlock level visibility", () => {
  it("changes only showSkillLevels and leaves every skill level intact", () => {
    const skills = [
      { id: 1, name: "JavaScript", level: 4 },
      { id: 2, name: "React", level: 3 },
    ];
    const onChange = vi.fn();
    const onShowSkillLevelsChange = vi.fn();
    renderSkills(skills, onChange, true, onShowSkillLevelsChange);

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Не показывать уровень навыков",
      })
    );

    expect(onShowSkillLevelsChange).toHaveBeenCalledWith(false);
    expect(onChange).not.toHaveBeenCalled();
    expect(skills.map((skill) => skill.level)).toEqual([4, 3]);
  });

  it("keeps level 4 after hide and show transitions", () => {
    const skill = { id: 1, name: "JavaScript", level: 4 };
    const onShowSkillLevelsChange = vi.fn();
    const view = renderSkills([skill], vi.fn(), false, onShowSkillLevelsChange);

    expect(
      screen.getByText("Уровни сохраняются, но не отображаются в резюме.")
    ).toBeInTheDocument();

    view.rerender(
      <SkillsBlock
        data={[skill]}
        onChange={vi.fn()}
        showSkillLevels
        onShowSkillLevelsChange={onShowSkillLevelsChange}
      />
    );

    expect(skill.level).toBe(4);
    expect(screen.getByText("JavaScript (4/5)")).toBeInTheDocument();
  });
});

describe("SkillsBlock reorder", () => {
  it("renders a drag handle for every skill", () => {
    renderSkills([
      { id: 1, name: "JavaScript", level: 4 },
      { id: 2, name: "SQL", level: 4 },
      { id: 3, name: "TypeScript", level: 4 },
    ]);

    expect(screen.getByLabelText("Перетащить навык «JavaScript»")).toBeInTheDocument();
    expect(screen.getByLabelText("Перетащить навык «SQL»")).toBeInTheDocument();
    expect(screen.getByLabelText("Перетащить навык «TypeScript»")).toBeInTheDocument();
  });

  it("passes the reordered array to the existing save flow without mutating skills", () => {
    const javascript = { id: 1, name: "JavaScript", level: 4 };
    const sql = { id: 2, name: "SQL", level: 4 };
    const typescript = { id: 3, name: "TypeScript", level: 4 };
    const original = [javascript, sql, typescript];
    const onChange = vi.fn();

    renderSkills(original, onChange);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Сымитировать изменение порядка навыков",
      })
    );

    expect(onChange).toHaveBeenCalledWith([javascript, typescript, sql]);
    expect(original).toEqual([javascript, sql, typescript]);
    expect(original.map((skill) => skill.level)).toEqual([4, 4, 4]);
  });
});
