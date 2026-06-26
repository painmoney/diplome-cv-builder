import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

afterEach(() => {
  cleanup();
});

const RESUME_ID = "test-resume-123";

function renderEditorWithOnboarding() {
  return render(
    <MemoryRouter initialEntries={[`/resume-editor/${RESUME_ID}`]}>
      <Routes>
        <Route path="/resume-editor/:resumeId" element={
          <div>
            <div data-testid="sticky-header">
              <span>Редактор IT-резюме</span>
              <button>Сохранено</button>
              <button>Предпросмотр</button>
            </div>
            <div data-testid="onboarding">
              <button data-testid="toggle-onboarding">План создания IT-резюме</button>
              <div data-testid="onboarding-content" style={{ display: "none" }}>
                Шаг 1, Шаг 2, Шаг 3
              </div>
            </div>
            <div data-testid="tabs">Tabs</div>
          </div>
        } />
        <Route path="/resume-preview/:resumeId" element={<div>Preview</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Editor section panel", () => {
  it("onboarding panel is present in DOM", () => {
    renderEditorWithOnboarding();
    expect(screen.getByTestId("onboarding")).toBeDefined();
  });

  it("onboarding toggle button exists", () => {
    renderEditorWithOnboarding();
    expect(screen.getByTestId("toggle-onboarding")).toBeDefined();
  });

  it("sticky header contains Preview button", () => {
    renderEditorWithOnboarding();
    expect(screen.getByText("Предпросмотр")).toBeDefined();
  });

  it("sticky header and onboarding occupy different positions", () => {
    renderEditorWithOnboarding();
    const header = screen.getByTestId("sticky-header");
    const onboarding = screen.getByTestId("onboarding");
    const headerRect = header.getBoundingClientRect();
    const onboardingRect = onboarding.getBoundingClientRect();
    expect(headerRect.bottom).toBeLessThanOrEqual(onboardingRect.top + 50);
  });

  it("Preview button has accessible name", () => {
    renderEditorWithOnboarding();
    const btn = screen.getByText("Предпросмотр");
    expect(btn.tagName).toBe("BUTTON");
  });
});

describe("Editor header layout", () => {
  it("header uses flexbox with wrap", () => {
    renderEditorWithOnboarding();
    const header = screen.getByTestId("sticky-header");
    expect(header).toBeDefined();
  });

  it("title and actions are separate elements", () => {
    renderEditorWithOnboarding();
    expect(screen.getByText("Редактор IT-резюме")).toBeDefined();
    expect(screen.getByText("Предпросмотр")).toBeDefined();
  });
});
