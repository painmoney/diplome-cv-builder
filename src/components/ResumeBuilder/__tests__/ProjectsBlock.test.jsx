import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import ProjectsBlock from "../ProjectsBlock";

afterEach(() => {
  cleanup();
});

const SAMPLE_PROJECTS = [
  {
    id: "proj_1",
    name: "CV Builder",
    role: "Fullstack Developer",
    description: "Built a CV builder",
    techStack: "React, Supabase",
    link: "https://example.com",
    period: "2025",
  },
  {
    id: "proj_2",
    name: "Task Manager",
    role: "Backend Developer",
    description: "Built a task manager",
    techStack: "Node.js, PostgreSQL",
    link: "",
    period: "2024",
  },
];

describe("ProjectsBlock — rendering", () => {
  it("renders all projects in view mode by default", () => {
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={vi.fn()} />);
    expect(screen.getByText("CV Builder")).toBeDefined();
    expect(screen.getByText("Task Manager")).toBeDefined();
  });

  it("renders empty state when no projects", () => {
    render(<ProjectsBlock data={[]} onChange={vi.fn()} />);
    expect(screen.getByText("Пока нет ручных проектов")).toBeDefined();
  });

  it("does not show empty state when has pending new", () => {
    render(<ProjectsBlock data={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Добавить проект"));
    expect(screen.queryByText("Пока нет ручных проектов")).toBeNull();
  });

  it("shows add button", () => {
    render(<ProjectsBlock data={[]} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Добавить проект/ })).toBeDefined();
  });
});

describe("ProjectsBlock — add new project", () => {
  it("clicking add opens new draft card", () => {
    render(<ProjectsBlock data={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Добавить проект"));
    expect(screen.getByText("Сохранить проект")).toBeDefined();
    expect(screen.getByText("Отмена")).toBeDefined();
  });

  it("save new project calls onChange with new project", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText("Добавить проект"));
    const nameInput = screen.getByLabelText("Название проекта");
    fireEvent.change(nameInput, { target: { value: "New Project" } });
    fireEvent.click(screen.getByText("Сохранить проект"));
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "New Project" })])
    );
  });

  it("cancel new project does not call onChange", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText("Добавить проект"));
    fireEvent.click(screen.getByText("Отмена"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cancel new project removes draft card", () => {
    render(<ProjectsBlock data={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("Добавить проект"));
    expect(screen.getByText("Сохранить проект")).toBeDefined();
    fireEvent.click(screen.getByText("Отмена"));
    expect(screen.queryByText("Сохранить проект")).toBeNull();
  });

  it("save new project adds to existing projects", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={onChange} />);
    fireEvent.click(screen.getByText("Добавить проект"));
    fireEvent.click(screen.getByText("Сохранить проект"));
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: "proj_1" }),
      expect.objectContaining({ id: "proj_2" }),
      expect.anything(),
    ]));
  });
});

describe("ProjectsBlock — edit existing project", () => {
  it("edit opens form for correct project", () => {
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={vi.fn()} />);
    const editBtns = screen.getAllByRole("button", { name: /Редактировать/ });
    fireEvent.click(editBtns[0]);
    expect(screen.getByDisplayValue("CV Builder")).toBeDefined();
    expect(screen.queryByDisplayValue("Task Manager")).toBeNull();
  });

  it("save edit calls onChange with updated array", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={onChange} />);
    const editBtns = screen.getAllByRole("button", { name: /Редактировать/ });
    fireEvent.click(editBtns[0]);
    fireEvent.click(screen.getByText("Сохранить изменения"));
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: "proj_1", name: "CV Builder" }),
      expect.objectContaining({ id: "proj_2" }),
    ]));
  });

  it("cancel edit does not call onChange", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={onChange} />);
    const editBtns = screen.getAllByRole("button", { name: /Редактировать/ });
    fireEvent.click(editBtns[0]);
    fireEvent.click(screen.getByText("Отмена"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("editing project A does not affect project B", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={onChange} />);
    const editBtns = screen.getAllByRole("button", { name: /Редактировать/ });
    fireEvent.click(editBtns[0]);
    const nameInput = screen.getByDisplayValue("CV Builder");
    fireEvent.change(nameInput, { target: { value: "Changed" } });
    fireEvent.click(screen.getByText("Сохранить изменения"));
    const result = onChange.mock.calls[0][0];
    expect(result[0].name).toBe("Changed");
    expect(result[1].name).toBe("Task Manager");
  });
});

describe("ProjectsBlock — delete", () => {
  it("delete removes correct project", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={onChange} />);
    const deleteBtns = screen.getAllByRole("button", { name: /Удалить/ });
    fireEvent.click(deleteBtns[1]);
    expect(onChange).toHaveBeenCalledWith([SAMPLE_PROJECTS[0]]);
  });

  it("cancel new draft removes it without calling onChange", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText("Добавить проект"));
    expect(screen.getByText("Сохранить проект")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Отмена/ }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText("Сохранить проект")).toBeNull();
  });
});

describe("ProjectsBlock — identity preservation", () => {
  it("save preserves id of edited project", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={onChange} />);
    const editBtns = screen.getAllByRole("button", { name: /Редактировать/ });
    fireEvent.click(editBtns[0]);
    fireEvent.click(screen.getByText("Сохранить изменения"));
    const result = onChange.mock.calls[0][0];
    expect(result[0].id).toBe("proj_1");
    expect(result[1].id).toBe("proj_2");
  });

  it("save preserves array order", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={onChange} />);
    const editBtns = screen.getAllByRole("button", { name: /Редактировать/ });
    fireEvent.click(editBtns[0]);
    fireEvent.click(screen.getByText("Сохранить изменения"));
    const result = onChange.mock.calls[0][0];
    expect(result[0].id).toBe("proj_1");
    expect(result[1].id).toBe("proj_2");
  });

  it("new project added at end", () => {
    const onChange = vi.fn();
    render(<ProjectsBlock data={SAMPLE_PROJECTS} onChange={onChange} />);
    fireEvent.click(screen.getByText("Добавить проект"));
    fireEvent.click(screen.getByText("Сохранить проект"));
    const result = onChange.mock.calls[0][0];
    expect(result).toHaveLength(3);
    expect(result[2]).toBeDefined();
  });
});
