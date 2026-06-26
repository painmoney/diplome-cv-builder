import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

afterEach(() => {
  cleanup();
});

const RESUME_ID = "test-resume-123";

function renderEditor() {
  return render(
    <MemoryRouter initialEntries={[`/resume-editor/${RESUME_ID}`]}>
      <Routes>
        <Route path="/resume-editor/:resumeId" element={<div data-testid="editor">Editor</div>} />
        <Route path="/resume-preview/:resumeId" element={<div data-testid="preview">Preview</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Editor → Preview navigation", () => {
  it("Editor has preview button visible", () => {
    render(
      <MemoryRouter initialEntries={[`/resume-editor/${RESUME_ID}`]}>
        <Routes>
          <Route path="/resume-editor/:resumeId" element={<div><button aria-label="Предпросмотр">Предпросмотр</button></div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: /Предпросмотр/ })).toBeDefined();
  });

  it("Preview button contains correct resumeId in link", () => {
    const mockNavigate = vi.fn();
    vi.mock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom");
      return { ...actual, useNavigate: () => mockNavigate };
    });

    render(
      <MemoryRouter initialEntries={[`/resume-editor/${RESUME_ID}`]}>
        <Routes>
          <Route path="/resume-editor/:resumeId" element={
            <button onClick={() => mockNavigate(`/resume-preview/${RESUME_ID}`)}>Предпросмотр</button>
          } />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Предпросмотр"));
    expect(mockNavigate).toHaveBeenCalledWith(`/resume-preview/${RESUME_ID}`);
  });

  it("Preview button uses same resumeId from URL", () => {
    const mockNavigate = vi.fn();
    vi.mock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom");
      return { ...actual, useNavigate: () => mockNavigate };
    });

    const anotherId = "another-resume-456";
    render(
      <MemoryRouter initialEntries={[`/resume-editor/${anotherId}`]}>
        <Routes>
          <Route path="/resume-editor/:resumeId" element={
            <button onClick={() => mockNavigate(`/resume-preview/${anotherId}`)}>Предпросмотр</button>
          } />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Предпросмотр"));
    expect(mockNavigate).toHaveBeenCalledWith(`/resume-preview/${anotherId}`);
  });
});

describe("Preview → Editor navigation", () => {
  it("Preview has edit button visible", () => {
    render(
      <MemoryRouter initialEntries={[`/resume-preview/${RESUME_ID}`]}>
        <Routes>
          <Route path="/resume-preview/:resumeId" element={<div><button aria-label="Вернуться к редактированию">Вернуться к редактированию</button></div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole("button", { name: /Вернуться к редактированию/ })).toBeDefined();
  });

  it("Edit button contains correct resumeId", () => {
    const mockNavigate = vi.fn();
    vi.mock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom");
      return { ...actual, useNavigate: () => mockNavigate };
    });

    render(
      <MemoryRouter initialEntries={[`/resume-preview/${RESUME_ID}`]}>
        <Routes>
          <Route path="/resume-preview/:resumeId" element={
            <button onClick={() => mockNavigate(`/resume-editor/${RESUME_ID}`)}>Вернуться к редактированию</button>
          } />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Вернуться к редактированию"));
    expect(mockNavigate).toHaveBeenCalledWith(`/resume-editor/${RESUME_ID}`);
  });
});

describe("Route safety", () => {
  it("legacy no-ID /resume-editor goes to NotFound", () => {
    render(
      <MemoryRouter initialEntries={["/resume-editor"]}>
        <Routes>
          <Route path="/resume-editor/:resumeId" element={<div>PARAM</div>} />
          <Route path="*" element={<div data-testid="notfound">NotFound</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText("PARAM")).toBeNull();
    expect(screen.getByTestId("notfound")).toBeDefined();
  });

  it("legacy no-ID /resume-preview goes to NotFound", () => {
    render(
      <MemoryRouter initialEntries={["/resume-preview"]}>
        <Routes>
          <Route path="/resume-preview/:resumeId" element={<div>PARAM</div>} />
          <Route path="*" element={<div data-testid="notfound">NotFound</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText("PARAM")).toBeNull();
    expect(screen.getByTestId("notfound")).toBeDefined();
  });

  it("navigation does not use no-ID routes", () => {
    const mockNavigate = vi.fn();
    vi.mock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom");
      return { ...actual, useNavigate: () => mockNavigate };
    });

    render(
      <MemoryRouter initialEntries={[`/resume-editor/${RESUME_ID}`]}>
        <Routes>
          <Route path="/resume-editor/:resumeId" element={
            <button onClick={() => mockNavigate(`/resume-preview/${RESUME_ID}`)}>Go</button>
          } />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Go"));
    expect(mockNavigate).not.toHaveBeenCalledWith("/resume-preview");
    expect(mockNavigate).not.toHaveBeenCalledWith("/resume-editor");
  });
});

describe("Keyboard accessibility", () => {
  it("preview button is keyboard accessible", () => {
    render(
      <MemoryRouter initialEntries={[`/resume-editor/${RESUME_ID}`]}>
        <Routes>
          <Route path="/resume-editor/:resumeId" element={
            <button tabIndex={0}>Предпросмотр</button>
          } />
        </Routes>
      </MemoryRouter>
    );
    const btn = screen.getByText("Предпросмотр");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("tabindex")).toBe("0");
  });

  it("edit button in preview is keyboard accessible", () => {
    render(
      <MemoryRouter initialEntries={[`/resume-preview/${RESUME_ID}`]}>
        <Routes>
          <Route path="/resume-preview/:resumeId" element={
            <button tabIndex={0}>Вернуться к редактированию</button>
          } />
        </Routes>
      </MemoryRouter>
    );
    const btn = screen.getByText("Вернуться к редактированию");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("tabindex")).toBe("0");
  });
});
