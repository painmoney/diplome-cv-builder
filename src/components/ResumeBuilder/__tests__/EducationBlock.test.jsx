import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import EducationBlock from "../EducationBlock";

const mockOnChange = vi.fn();

const sampleData = [
  { id: 1, institution: "MIT", institute: "CS", department: "AI", program: "ML", degree: "MS", years: "2020-2022" },
  { id: 2, institution: "Stanford", institute: "Eng", department: "", program: "SE", degree: "BS", years: "2016-2020" },
];

function renderEdu(data = sampleData, onChange = mockOnChange) {
  return render(<EducationBlock data={data} onChange={onChange} />);
}

function getAddBtn() {
  return screen.getAllByRole("button").find(
    (b) => b.textContent.trim() === "Добавить" && !b.closest("[role=dialog]")
  );
}

describe("EducationBlock delete confirmation", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("clicking delete opens confirmation dialog", () => {
    renderEdu();
    const deleteBtns = screen.getAllByRole("button", { name: "Удалить образование" });
    fireEvent.click(deleteBtns[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Удалить образование?")).toBeInTheDocument();
  });

  it("Cancel preserves the record", () => {
    renderEdu();
    const deleteBtns = screen.getAllByRole("button", { name: "Удалить образование" });
    fireEvent.click(deleteBtns[0]);
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("Confirm removes correct record once", () => {
    renderEdu();
    const deleteBtns = screen.getAllByRole("button", { name: "Удалить образование" });
    fireEvent.click(deleteBtns[0]);
    const dialog = screen.getByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: "Удалить" });
    fireEvent.click(confirmBtn);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: 2, institution: "Stanford", institute: "Eng", department: "", program: "SE", degree: "BS", years: "2016-2020" },
    ]);
  });
});

describe("EducationBlock form validation", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("empty institution shows inline error", () => {
    renderEdu([], mockOnChange);
    fireEvent.click(getAddBtn());
    expect(screen.getByText("Укажите название учебного заведения")).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("valid submit adds record", () => {
    renderEdu([], mockOnChange);
    fireEvent.change(screen.getByLabelText("ВУЗ"), { target: { value: "Harvard" } });
    fireEvent.click(getAddBtn());
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ institution: "Harvard" })])
    );
  });

  it("error clears when user types", () => {
    renderEdu([], mockOnChange);
    fireEvent.click(getAddBtn());
    expect(screen.getByText("Укажите название учебного заведения")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("ВУЗ"), { target: { value: "X" } });
    expect(screen.queryByText("Укажите название учебного заведения")).not.toBeInTheDocument();
  });
});

describe("EducationBlock reorder", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("renders accessible drag handles for education cards", () => {
    renderEdu();
    expect(screen.getByLabelText("Перетащить образование «MIT»")).toBeInTheDocument();
    expect(screen.getByLabelText("Перетащить образование «Stanford»")).toBeInTheDocument();
  });
});
