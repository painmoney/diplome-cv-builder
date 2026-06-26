import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TemplatePicker from "../TemplatePicker";
import { TEMPLATE_REGISTRY } from "../../../utils/templateRegistry";

afterEach(() => {
  cleanup();
});

const TEMPLATE_COUNT = Object.keys(TEMPLATE_REGISTRY).length;

describe("TemplatePicker — rendering", () => {
  it("shows current template label in trigger", () => {
    render(<TemplatePicker value="minimalist" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Минималистичный/ })).toBeDefined();
  });

  it("shows fallback for unknown template", () => {
    render(<TemplatePicker value="nonexistent" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Минималистичный/ })).toBeDefined();
  });

  it("trigger has aria-haspopup", () => {
    render(<TemplatePicker value="minimalist" onChange={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Минималистичный/ });
    expect(btn.getAttribute("aria-haspopup")).toBe("true");
  });
});

describe("TemplatePicker — popover", () => {
  it("opens popover on click", () => {
    render(<TemplatePicker value="minimalist" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Минималистичный/ }));
    expect(screen.getByText("Выберите шаблон")).toBeDefined();
  });

  it("shows all registry template labels", () => {
    render(<TemplatePicker value="minimalist" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Минималистичный/ }));
    for (const tpl of Object.values(TEMPLATE_REGISTRY)) {
      expect(screen.getAllByText(tpl.label).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("template card count matches registry", () => {
    render(<TemplatePicker value="minimalist" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Минималистичный/ }));
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBe(TEMPLATE_COUNT);
  });

  it("selected option is marked checked", () => {
    render(<TemplatePicker value="github" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /GitHub/ }));
    const radios = screen.getAllByRole("radio");
    const checked = radios.filter((r) => r.getAttribute("aria-checked") === "true" || r.checked);
    expect(checked.length).toBeGreaterThanOrEqual(1);
  });
});

describe("TemplatePicker — selection behavior", () => {
  it("selecting new template calls onChange with correct id", () => {
    const onChange = vi.fn();
    render(<TemplatePicker value="minimalist" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Минималистичный/ }));
    const githubLabel = screen.getAllByText("GitHub-стиль")[0];
    fireEvent.click(githubLabel.closest('[role="radio"]') || githubLabel.parentElement);
    expect(onChange).toHaveBeenCalledWith("github");
  });

  it("selecting current template does not call onChange", () => {
    const onChange = vi.fn();
    render(<TemplatePicker value="minimalist" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Минималистичный/ }));
    const radios = screen.getAllByRole("radio");
    const checkedRadio = radios.find((r) => r.checked || r.getAttribute("aria-checked") === "true");
    expect(checkedRadio).toBeTruthy();
    fireEvent.click(checkedRadio);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closing without selection does not call onChange", () => {
    const onChange = vi.fn();
    render(<TemplatePicker value="minimalist" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Минималистичный/ }));
    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("TemplatePicker — no save on open/close", () => {
  it("opening picker does not trigger onChange", () => {
    const onChange = vi.fn();
    render(<TemplatePicker value="minimalist" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Минималистичный/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closing without selecting does not trigger onChange", () => {
    const onChange = vi.fn();
    render(<TemplatePicker value="minimalist" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Минималистичный/ }));
    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("TemplatePicker — labels from registry", () => {
  it("all visible labels match registry entries", () => {
    render(<TemplatePicker value="minimalist" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Минималистичный/ }));
    for (const tpl of Object.values(TEMPLATE_REGISTRY)) {
      expect(screen.getAllByText(tpl.label).length).toBeGreaterThanOrEqual(1);
    }
  });
});
