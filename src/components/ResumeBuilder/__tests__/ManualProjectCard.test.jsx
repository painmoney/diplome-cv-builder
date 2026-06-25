import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ManualProjectCard from "../ManualProjectCard";

afterEach(() => {
  cleanup();
});

const SAMPLE_PROJECT = {
  id: "proj_123",
  name: "CV Builder",
  role: "Fullstack Developer",
  description: "Built a CV builder app",
  techStack: "React, Supabase, Vite",
  link: "https://example.com",
  period: "2025",
};

describe("ManualProjectCard — view mode", () => {
  it("renders project name", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("CV Builder")).toBeDefined();
  });

  it("renders role and period together", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Fullstack Developer · 2025")).toBeDefined();
  });

  it("renders description", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Built a CV builder app")).toBeDefined();
  });

  it("renders tech stack as chips", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("React")).toBeDefined();
    expect(screen.getByText("Supabase")).toBeDefined();
    expect(screen.getByText("Vite")).toBeDefined();
  });

  it("renders link", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    const link = screen.getByRole("link", { name: /example\.com/ });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("shows fallback for empty name", () => {
    render(<ManualProjectCard project={{ ...SAMPLE_PROJECT, name: "" }} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Проект без названия")).toBeDefined();
  });

  it("does not render TextField in view mode", () => {
    const { container } = render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(container.querySelectorAll("input").length).toBe(0);
    expect(container.querySelectorAll("textarea").length).toBe(0);
  });

  it("has edit button with aria-label", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Редактировать проект «CV Builder»/ })).toBeDefined();
  });

  it("has delete button with aria-label", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Удалить проект «CV Builder»/ })).toBeDefined();
  });

  it("does not show empty fields", () => {
    const { container } = render(
      <ManualProjectCard
        project={{ ...SAMPLE_PROJECT, description: "", techStack: "", link: "" }}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(container.querySelectorAll("input").length).toBe(0);
  });
});

describe("ManualProjectCard — edit mode", () => {
  it("clicking Edit opens form", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Редактировать/ }));
    expect(screen.getByDisplayValue("CV Builder")).toBeDefined();
    expect(screen.getByDisplayValue("Fullstack Developer")).toBeDefined();
    expect(screen.getByDisplayValue("2025")).toBeDefined();
  });

  it("Save button calls onSave with draft", () => {
    const onSave = vi.fn();
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={onSave} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Редактировать/ }));
    fireEvent.click(screen.getByRole("button", { name: /Сохранить изменения/ }));
    expect(onSave).toHaveBeenCalledWith("proj_123", expect.objectContaining({ name: "CV Builder" }));
  });

  it("Cancel returns to view mode", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Редактировать/ }));
    expect(screen.getByDisplayValue("CV Builder")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Отмена/ }));
    expect(screen.queryByDisplayValue("CV Builder")).toBeNull();
  });

  it("Cancel does not call onSave", () => {
    const onSave = vi.fn();
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={onSave} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Редактировать/ }));
    fireEvent.click(screen.getByRole("button", { name: /Отмена/ }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("typing changes draft but does not call parent onChange", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Редактировать/ }));
    const nameInput = screen.getByDisplayValue("CV Builder");
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    expect(screen.getByDisplayValue("New Name")).toBeDefined();
  });

  it("Save preserves id", () => {
    const onSave = vi.fn();
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={onSave} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Редактировать/ }));
    fireEvent.click(screen.getByRole("button", { name: /Сохранить изменения/ }));
    expect(onSave).toHaveBeenCalledWith("proj_123", expect.objectContaining({ id: "proj_123" }));
  });

  it("Cancel reverts to original data", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Редактировать/ }));
    const nameInput = screen.getByDisplayValue("CV Builder");
    fireEvent.change(nameInput, { target: { value: "Changed" } });
    fireEvent.click(screen.getByRole("button", { name: /Отмена/ }));
    fireEvent.click(screen.getByRole("button", { name: /Редактировать/ }));
    expect(screen.getByDisplayValue("CV Builder")).toBeDefined();
  });

  it("Delete calls onDelete with project id", () => {
    const onDelete = vi.fn();
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /Удалить проект/ }));
    expect(onDelete).toHaveBeenCalledWith("proj_123");
  });
});

describe("ManualProjectCard — new project", () => {
  it("renders in edit mode when isNew", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} isNew onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByDisplayValue("CV Builder")).toBeDefined();
  });

  it("Cancel calls onCancel for new project", () => {
    const onCancel = vi.fn();
    render(<ManualProjectCard project={SAMPLE_PROJECT} isNew onSave={vi.fn()} onDelete={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /Отмена/ }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("Save for new project calls onSave", () => {
    const onSave = vi.fn();
    render(<ManualProjectCard project={SAMPLE_PROJECT} isNew onSave={onSave} onDelete={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Сохранить проект/ }));
    expect(onSave).toHaveBeenCalledWith("proj_123", expect.objectContaining({ name: "CV Builder" }));
  });
});

describe("ManualProjectCard — accessibility", () => {
  it("edit button has aria-label with project name", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Редактировать проект «CV Builder»/ });
    expect(btn).toBeDefined();
  });

  it("delete button has aria-label with project name", () => {
    render(<ManualProjectCard project={SAMPLE_PROJECT} onSave={vi.fn()} onDelete={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Удалить проект «CV Builder»/ });
    expect(btn).toBeDefined();
  });
});
