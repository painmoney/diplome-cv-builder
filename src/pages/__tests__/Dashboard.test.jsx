import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "test@test.com" } }),
}));

const mockFromFn = vi.fn();
vi.mock("../../api/supabaseClient", () => ({
  supabase: { from: mockFromFn },
}));

vi.mock("../../api/resumeService", () => ({
  listUserResumes: vi.fn(),
  createNewResume: vi.fn(),
  renameResumeById: vi.fn(),
  duplicateResumeById: vi.fn(),
  deleteResumeById: vi.fn(),
}));

vi.mock("../../api/storage", () => ({
  getAvatarUrl: vi.fn(() => ""),
}));

import Dashboard from "../Dashboard";
import {
  listUserResumes,
  createNewResume,
  renameResumeById,
  duplicateResumeById,
  deleteResumeById,
} from "../../api/resumeService";

const MOCK_LIST = [
  { resumeId: "aaa", title: "Resume A", template: "minimalist", revision: 1, createdAt: "2026-01-01", updatedAt: "2026-01-02" },
  { resumeId: "bbb", title: "Resume B", template: "academic", revision: 2, createdAt: "2026-01-03", updatedAt: "2026-01-04" },
];

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume-editor/:resumeId" element={<div />} />
        <Route path="/resume-preview/:resumeId" element={<div />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFromFn.mockReset();
});

describe("Dashboard", () => {
  it("shows loading while fetching", () => {
    listUserResumes.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders cards after load", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Resume B").length).toBeGreaterThan(0);
    });
  });

  it("shows template labels", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("Минималистичный").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Академический").length).toBeGreaterThan(0);
  });

  it("shows empty state for no resumes", async () => {
    listUserResumes.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText(/У вас пока нет резюме/).length).toBeGreaterThan(0);
    });
  });

  it("shows error with retry", async () => {
    listUserResumes.mockRejectedValue(new Error("net"));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText(/Не удалось загрузить/).length).toBeGreaterThan(0);
      expect(screen.getAllByText("Повторить").length).toBeGreaterThan(0);
    });
  });

  it("each card has Edit and Preview buttons", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("Редактировать").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Просмотр").length).toBeGreaterThanOrEqual(2);
  });

  it("create calls createNewResume", async () => {
    listUserResumes.mockResolvedValue([]);
    createNewResume.mockResolvedValue({ resumeId: "new-id", revision: 1 });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Создать резюме").length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getAllByText("Создать резюме")[0]);
    await waitFor(() => expect(createNewResume).toHaveBeenCalledTimes(1));
    expect(createNewResume).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it("create button disables during request", async () => {
    listUserResumes.mockResolvedValue([]);
    let resolveCreate;
    createNewResume.mockImplementation(() => new Promise((r) => { resolveCreate = r; }));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Создать резюме").length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getAllByText("Создать резюме")[0]);
    await waitFor(() => {
      expect(screen.getAllByText("Создание...").length).toBeGreaterThan(0);
    });

    expect(createNewResume).toHaveBeenCalledTimes(1);
    resolveCreate({ resumeId: "x", revision: 1 });
  });

  it("create error shown", async () => {
    listUserResumes.mockResolvedValue([]);
    createNewResume.mockRejectedValue(new Error("fail"));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Создать резюме").length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getAllByText("Создать резюме")[0]);
    await waitFor(() => {
      expect(screen.getAllByText(/Не удалось создать/).length).toBeGreaterThan(0);
    });
  });

  it("rename opens dialog, saves, closes", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    renameResumeById.mockResolvedValue({});
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getAllByTestId("MoreVertIcon")[0]);
    await userEvent.click(screen.getByText("Переименовать"));

    const input = screen.getByDisplayValue("Resume A");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    await userEvent.click(screen.getByText("Сохранить"));

    await waitFor(() => expect(renameResumeById).toHaveBeenCalledWith("aaa", "New Name"));
  });

  it("rename cancel does not call service", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getAllByTestId("MoreVertIcon")[0]);
    await userEvent.click(screen.getByText("Переименовать"));

    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByText("Отмена"));

    expect(renameResumeById).not.toHaveBeenCalled();
  });

  it("duplicate calls service", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    duplicateResumeById.mockResolvedValue({});
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getAllByTestId("MoreVertIcon")[0]);
    await userEvent.click(screen.getByText("Создать копию"));

    await waitFor(() => expect(duplicateResumeById).toHaveBeenCalledWith("aaa"));
  });

  it("delete flow: menu → dialog → confirm", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    deleteResumeById.mockResolvedValue("aaa");
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
    });

    const icons = screen.getAllByTestId("MoreVertIcon");
    const btn = icons[0].closest("button");
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const deleteItem = await screen.findByText("Удалить", { selector: "[role=menuitem]" });
    fireEvent.click(deleteItem);

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Удалить" }));

    await waitFor(() => expect(deleteResumeById).toHaveBeenCalledWith("aaa"));
  });

  it("delete flow: menu → dialog → cancel", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
    });

    const icons = screen.getAllByTestId("MoreVertIcon");
    const btn = icons[0].closest("button");
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const deleteItem = await screen.findByText("Удалить", { selector: "[role=menuitem]" });
    fireEvent.click(deleteItem);

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Отмена" }));

    expect(deleteResumeById).not.toHaveBeenCalled();
  });

  it("uses listUserResumes, not direct query", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
    });
    expect(listUserResumes).toHaveBeenCalledWith("user-1");
    expect(mockFromFn).not.toHaveBeenCalled();
  });

  it("listUserResumes result is displayed", async () => {
    listUserResumes.mockResolvedValue(MOCK_LIST);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Resume B").length).toBeGreaterThan(0);
    });
  });

  it("retry after error shows fresh data", async () => {
    listUserResumes.mockRejectedValueOnce(new Error("net"));
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText(/Не удалось загрузить/).length).toBeGreaterThan(0);
    });

    listUserResumes.mockResolvedValueOnce(MOCK_LIST);
    await userEvent.click(screen.getAllByText("Повторить")[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Resume A").length).toBeGreaterThan(0);
    });
  });
});
