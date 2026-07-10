import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import ExperienceBlock from "../ExperienceBlock";

const mockOnChange = vi.fn();

const sampleData = [
  { id: 1, company: "Acme", position: "Dev", period: "2023-2024", description: "Built things" },
  { id: 2, company: "Beta", position: "QA", period: "2022-2023", description: "Tested things" },
];

function renderExp(data = sampleData, onChange = mockOnChange) {
  return render(<ExperienceBlock data={data} onChange={onChange} />);
}

function createDataTransfer() {
  const store = {};
  return {
    effectAllowed: "",
    setData: vi.fn((type, value) => {
      store[type] = value;
    }),
    getData: vi.fn((type) => store[type] || ""),
  };
}

describe("ExperienceBlock delete confirmation", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("clicking delete opens confirmation dialog", () => {
    renderExp();
    const deleteBtns = screen.getAllByRole("button", { name: "Удалить опыт" });
    fireEvent.click(deleteBtns[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Удалить место работы?")).toBeInTheDocument();
  });

  it("record remains before confirmation", () => {
    renderExp();
    const deleteBtns = screen.getAllByRole("button", { name: "Удалить опыт" });
    fireEvent.click(deleteBtns[0]);
    expect(mockOnChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Cancel preserves the record", () => {
    renderExp();
    const deleteBtns = screen.getAllByRole("button", { name: "Удалить опыт" });
    fireEvent.click(deleteBtns[0]);
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("Escape preserves the record", () => {
    renderExp();
    const deleteBtns = screen.getAllByRole("button", { name: "Удалить опыт" });
    fireEvent.click(deleteBtns[0]);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("Confirm removes correct record once", () => {
    renderExp();
    const deleteBtns = screen.getAllByRole("button", { name: "Удалить опыт" });
    fireEvent.click(deleteBtns[0]);
    const dialog = screen.getByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: "Удалить" });
    fireEvent.click(confirmBtn);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: 2, company: "Beta", position: "QA", period: "2022-2023", description: "Tested things" },
    ]);
  });

  it("dialog has accessible title", () => {
    renderExp();
    const deleteBtns = screen.getAllByRole("button", { name: "Удалить опыт" });
    fireEvent.click(deleteBtns[0]);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "confirm-dialog-title");
    expect(dialog).toHaveAttribute("aria-describedby", "confirm-dialog-description");
  });
});

describe("ExperienceBlock form validation", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  function getAddBtn() {
    return screen.getAllByRole("button").find(
      (b) => b.textContent.includes("Добавить опыт") && !b.closest("[role=dialog]")
    );
  }

  it("empty company shows inline error", () => {
    renderExp([], mockOnChange);
    fireEvent.click(getAddBtn());
    expect(screen.getByText("Укажите название компании")).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("empty company does not trigger autosave", () => {
    renderExp([], mockOnChange);
    fireEvent.click(getAddBtn());
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("valid submit adds record", () => {
    renderExp([], mockOnChange);
    fireEvent.change(screen.getByLabelText("Компания"), { target: { value: "NewCo" } });
    fireEvent.click(getAddBtn());
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ company: "NewCo" })])
    );
  });

  it("error clears when user types", () => {
    renderExp([], mockOnChange);
    fireEvent.click(getAddBtn());
    expect(screen.getByText("Укажите название компании")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Компания"), { target: { value: "X" } });
    expect(screen.queryByText("Укажите название компании")).not.toBeInTheDocument();
  });
});

describe("ExperienceBlock reorder", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("moves an experience card below another card with drag and drop", () => {
    renderExp();
    const dataTransfer = createDataTransfer();
    const source = screen.getByLabelText("Перетащить опыт «Acme»");
    const targetCard = screen.getByLabelText("Перетащить опыт «Beta»").closest(".MuiCard-root");

    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.drop(targetCard, { dataTransfer });

    expect(mockOnChange).toHaveBeenCalledWith([sampleData[1], sampleData[0]]);
  });
});
