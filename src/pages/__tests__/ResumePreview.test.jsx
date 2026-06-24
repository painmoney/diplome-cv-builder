import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../api/resumeService", () => ({
  loadResumeById: vi.fn(),
  loadUserResume: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@test.com" },
  }),
}));

vi.mock("../../api/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

vi.mock("html2canvas", () => ({ default: vi.fn() }));

import ResumePreview from "../ResumePreview";
import { loadResumeById, loadUserResume } from "../../api/resumeService";

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

const LEGACY_RESUME = {
  id: UUID_A,
  user_id: "user-1",
  title: "Legacy",
  template: "minimalist",
  revision: 1,
  created_at: "2026-01-01",
  updated_at: "2026-01-02",
  data: { profile: { name: "Legacy" }, skills: [], template: "minimalist" },
};

function renderPreview(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/resume-preview/:resumeId" element={<ResumePreview />} />
        <Route path="/resume-preview" element={<ResumePreview />} />
        <Route path="/resume-editor" element={<div />} />
        <Route path="/resume-editor/:resumeId" element={<div />} />
        <Route path="/dashboard" element={<div />} />
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

describe("ResumePreview routing", () => {
  it("dynamic: calls loadResumeById with route param", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderPreview(`/resume-preview/${UUID_A}`);
    await waitFor(() => expect(loadResumeById).toHaveBeenCalledWith(UUID_A));
  });

  it("dynamic: does not call loadUserResume", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderPreview(`/resume-preview/${UUID_A}`);
    await waitFor(() => expect(loadResumeById).toHaveBeenCalled());
    expect(loadUserResume).not.toHaveBeenCalled();
  });

  it("dynamic: renders profile name", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderPreview(`/resume-preview/${UUID_A}`);
    expect(await screen.findByText("User A")).toBeInTheDocument();
  });

  it("dynamic: shows not-found for null", async () => {
    loadResumeById.mockResolvedValue(null);
    renderPreview(`/resume-preview/${UUID_B}`);
    await waitFor(() => {
      const els = screen.getAllByText(/не найдено/);
      expect(els.length).toBeGreaterThan(0);
    });
  });

  it("dynamic: shows error on reject", async () => {
    loadResumeById.mockRejectedValue(new Error("net"));
    renderPreview(`/resume-preview/${UUID_A}`);
    await waitFor(() => {
      const els = screen.getAllByText(/Не удалось загрузить/);
      expect(els.length).toBeGreaterThan(0);
    });
  });

  it("legacy: calls loadUserResume", async () => {
    loadUserResume.mockResolvedValue(LEGACY_RESUME);
    renderPreview("/resume-preview");
    await waitFor(() => expect(loadUserResume).toHaveBeenCalledWith("user-1"));
  });

  it("no supabase write on load", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderPreview(`/resume-preview/${UUID_A}`);
    await waitFor(() => expect(loadResumeById).toHaveBeenCalled());
    const { supabase } = await import("../../api/supabaseClient");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("edit button present in dynamic mode", async () => {
    loadResumeById.mockResolvedValue(MOCK_A);
    renderPreview(`/resume-preview/${UUID_A}`);
    await screen.findByText("User A");
    expect(screen.getAllByText("Редактировать").length).toBeGreaterThan(0);
  });
});
