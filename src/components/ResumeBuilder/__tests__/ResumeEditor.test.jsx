import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../../api/resumeService", () => ({
  loadResumeById: vi.fn(),
  loadUserResume: vi.fn(),
  normalizeLoadedResumeData: vi.fn((d) => d),
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@test.com" },
  }),
}));

vi.mock("../../../api/supabaseClient", () => ({
  supabase: { from: vi.fn(() => ({ upsert: vi.fn().mockResolvedValue({ error: null }) })) },
}));

vi.mock("../../../hooks/useResumeSaveQueue", () => ({
  useResumeSaveQueue: () => ({
    enqueue: vi.fn(),
    resetGeneration: vi.fn(),
    initFromLoad: vi.fn(),
    queue: { resumeId: null, revision: null },
  }),
}));

vi.mock("../../../utils/validators", () => ({
  validateProfile: () => ({}),
  formatValidationToast: () => "",
}));

vi.mock("../../../utils/autosaveFingerprint", () => ({
  autosaveFingerprint: () => "fp",
}));

vi.mock("../../../utils/recommendationLogic", () => ({
  getRecommendations: () => [],
}));

vi.mock("../../../components/profile/ProfileForm", () => ({
  default: () => <div data-testid="profile-form" />,
}));

vi.mock("../../../components/ResumeBuilder/EducationBlock", () => ({ default: () => <div /> }));
vi.mock("../../../components/ResumeBuilder/SkillsBlock", () => ({ default: () => <div /> }));
vi.mock("../../../components/ResumeBuilder/ExperienceBlock", () => ({ default: () => <div /> }));
vi.mock("../../../components/ResumeBuilder/GitHubBlock", () => ({ default: () => <div /> }));
vi.mock("../../../components/ResumeBuilder/ProjectsBlock", () => ({ default: () => <div /> }));
vi.mock("../../../components/ResumeBuilder/TemplateSelector", () => ({ default: () => <div /> }));
vi.mock("../../../components/ResumeBuilder/JobMatchTab", () => ({ default: () => <div /> }));
vi.mock("../../../components/ResumeBuilder/ResumeHealthCheck", () => ({ default: () => <div /> }));
vi.mock("../../../components/ResumeBuilder/RecommendationPanel", () => ({ default: () => <div /> }));
vi.mock("../../../components/ResumeBuilder/OnboardingChecklist", () => ({ default: () => <div /> }));

import ResumeEditor from "../ResumeEditor";
import { loadResumeById, loadUserResume } from "../../../api/resumeService";

const UUID_A = "550e8400-e29b-41d4-a716-446655440001";
const UUID_B = "550e8400-e29b-41d4-a716-446655440002";

const MOCK_A = {
  resumeId: UUID_A,
  userId: "user-1",
  title: "Resume A",
  template: "minimalist",
  revision: 1,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-02",
  data: { profile: { name: "User A" }, skills: [], template: "minimalist" },
};

function renderEditor(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/resume-editor/:resumeId" element={<ResumeEditor />} />
        <Route path="/resume-preview/:resumeId" element={<div />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-fallback" />} />
        <Route path="*" element={<div data-testid="not-found-fallback" />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  delete globalThis.IntersectionObserver;
});

describe("ResumeEditor routing", () => {
  it("dynamic: calls loadResumeById with route param", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => expect(loadResumeById).toHaveBeenCalledWith(UUID_A));
  });

  it("dynamic: does not call loadUserResume", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => expect(loadResumeById).toHaveBeenCalled());
    expect(loadUserResume).not.toHaveBeenCalled();
  });

  it("dynamic: shows not-found for null", async () => {
    loadResumeById.mockResolvedValue(null);
    renderEditor(`/resume-editor/${UUID_B}`);
    await waitFor(() => {
      const els = screen.getAllByText(/не найдено/);
      expect(els.length).toBeGreaterThan(0);
    });
  });

  it("dynamic: shows error on reject", async () => {
    loadResumeById.mockRejectedValue(new Error("net"));
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => {
      const els = screen.getAllByText("net");
      expect(els.length).toBeGreaterThan(0);
    });
  });

  it("legacy /resume-editor no longer renders editor", async () => {
    renderEditor("/resume-editor");
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Редактор IT-резюме/ })).not.toBeInTheDocument();
    });
  });

  it("legacy /resume-editor hits catch-all, not editor component", async () => {
    renderEditor("/resume-editor");
    await waitFor(() => {
      expect(screen.getAllByTestId("not-found-fallback").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByRole("heading", { name: /Редактор IT-резюме/ })).not.toBeInTheDocument();
  });

  it("dynamic: shows loading indicator", async () => {
    loadUserResume.mockReturnValue(new Promise(() => {}));
    renderEditor(`/resume-editor/${MOCK_A.resumeId}`);
    expect(screen.getAllByText(/Загрузка резюме/).length).toBeGreaterThan(0);
  });
});

describe("ResumeEditor tabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.IntersectionObserver = class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    delete globalThis.IntersectionObserver;
  });

  function getLatestTablist() {
    const tablists = document.querySelectorAll('[role="tablist"]');
    return tablists[tablists.length - 1];
  }

  function getTab(tablist, name) {
    return Array.from(tablist.querySelectorAll('[role="tab"]')).find(
      (t) => t.textContent.includes(name)
    );
  }

  it("renders all seven tabs", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => {
      const tablist = getLatestTablist();
      expect(tablist).toBeInTheDocument();
      expect(getTab(tablist, "Профиль")).toBeDefined();
      expect(getTab(tablist, "Навыки")).toBeDefined();
      expect(getTab(tablist, "Образование")).toBeDefined();
      expect(getTab(tablist, "Опыт работы")).toBeDefined();
      expect(getTab(tablist, "Портфолио")).toBeDefined();
      expect(getTab(tablist, "Анализ вакансии")).toBeDefined();
      expect(getTab(tablist, "Проверка")).toBeDefined();
      expect(tablist.querySelectorAll('[role="tab"]').length).toBe(7);
    });
  });

  it("defaults to Profile tab selected", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => {
      const tablist = getLatestTablist();
      expect(tablist).toBeInTheDocument();
    });
    const tablist = getLatestTablist();
    const profileTab = getTab(tablist, "Профиль");
    expect(profileTab).toHaveAttribute("aria-selected", "true");
  });

  it("switches tab on click", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => {
      const tablist = getLatestTablist();
      expect(getTab(tablist, "Навыки")).toBeDefined();
    });
    const tablist = getLatestTablist();
    const skillsTab = getTab(tablist, "Навыки");
    fireEvent.click(skillsTab);
    expect(skillsTab).toHaveAttribute("aria-selected", "true");
    expect(getTab(tablist, "Профиль")).toHaveAttribute("aria-selected", "false");
  });

  it("uses scrollable Tabs variant", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => {
      const tablist = getLatestTablist();
      expect(tablist).toBeInTheDocument();
    });
    const scroller = document.querySelector(".MuiTabs-scroller");
    expect(scroller).toBeInTheDocument();
  });

  it("supports ArrowRight keyboard navigation", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => {
      const tablist = getLatestTablist();
      expect(getTab(tablist, "Профиль")).toBeDefined();
    });
    const tablist = getLatestTablist();
    const profileTab = getTab(tablist, "Профиль");
    profileTab.focus();
    fireEvent.keyDown(profileTab, { key: "ArrowRight" });
    const skillsTab = getTab(tablist, "Навыки");
    expect(skillsTab).toHaveFocus();
  });

  it("supports ArrowLeft keyboard navigation", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => {
      const tablist = getLatestTablist();
      expect(getTab(tablist, "Навыки")).toBeDefined();
    });
    const tablist = getLatestTablist();
    const skillsTab = getTab(tablist, "Навыки");
    skillsTab.focus();
    fireEvent.keyDown(skillsTab, { key: "ArrowLeft" });
    const profileTab = getTab(tablist, "Профиль");
    expect(profileTab).toHaveFocus();
  });

  it("tab activates on interaction", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderEditor(`/resume-editor/${UUID_A}`);
    await waitFor(() => {
      const tablist = getLatestTablist();
      expect(getTab(tablist, "Навыки")).toBeDefined();
    });
    const tablist = getLatestTablist();
    const skillsTab = getTab(tablist, "Навыки");
    skillsTab.focus();
    fireEvent.click(skillsTab);
    expect(skillsTab).toHaveAttribute("aria-selected", "true");
  });
});
