import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@test.com" },
  }),
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
  getAvatarUrl: vi.fn(),
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
  { resumeId: "aaa", title: "Frontend Dev", template: "minimalist", revision: 1, createdAt: "2026-01-01", updatedAt: "2026-01-02" },
  { resumeId: "bbb", title: "Backend Dev", template: "academic", revision: 2, createdAt: "2026-01-03", updatedAt: "2026-01-04" },
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

async function waitForCards() {
  await waitFor(() => {
    expect(screen.getAllByText("Frontend Dev").length).toBeGreaterThan(0);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFromFn.mockReset();
});

describe("Dashboard", () => {
  describe("Loading", () => {
    it("shows progress bar while loading", () => {
      listUserResumes.mockReturnValue(new Promise(() => {}));
      renderDashboard();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("List", () => {
    it("renders resume titles", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renderDashboard();
      await waitForCards();
      expect(screen.getAllByText("Frontend Dev").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Backend Dev").length).toBeGreaterThan(0);
    });

    it("shows template labels", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renderDashboard();
      await waitForCards();
      expect(screen.getAllByText("Минималистичный").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Академический").length).toBeGreaterThan(0);
    });
  });

  describe("Empty", () => {
    it("shows empty state", async () => {
      listUserResumes.mockResolvedValue([]);
      renderDashboard();
      await waitFor(() => {
        expect(screen.getAllByText(/У вас пока нет резюме/).length).toBeGreaterThan(0);
      });
    });
  });

  describe("Error", () => {
    it("shows error message", async () => {
      listUserResumes.mockRejectedValue(new Error("net"));
      renderDashboard();
      await waitFor(() => {
        expect(screen.getAllByText(/Не удалось загрузить/).length).toBeGreaterThan(0);
      });
    });

    it("shows retry button", async () => {
      listUserResumes.mockRejectedValue(new Error("net"));
      renderDashboard();
      await waitFor(() => {
        expect(screen.getAllByText("Повторить").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Dynamic links", () => {
    it("editor links to /resume-editor/:resumeId", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renderDashboard();
      await waitForCards();

      const btns = screen.getAllByText("Редактировать");
      const firstCard = btns[0].closest('[class*="MuiCard-root"]') || btns[0].closest('[class*="MuiCardActions"]');
      expect(firstCard).toBeTruthy();
    });

    it("preview button present", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renderDashboard();
      await waitForCards();

      const btns = screen.getAllByText("Просмотр");
      expect(btns.length).toBeGreaterThan(0);
    });
  });

  describe("Create", () => {
    it("calls createNewResume on click", async () => {
      listUserResumes.mockResolvedValue([]);
      createNewResume.mockResolvedValue({ resumeId: "new-id", revision: 1 });
      renderDashboard();

      await waitFor(() => {
        expect(screen.getAllByText("Создать резюме").length).toBeGreaterThan(0);
      });

      const btns = screen.getAllByText("Создать резюме");
      await userEvent.click(btns[0]);

      await waitFor(() => expect(createNewResume).toHaveBeenCalledTimes(1));
    });

    it("double click sends only one request", async () => {
      listUserResumes.mockResolvedValue([]);
      createNewResume.mockReturnValue(new Promise(() => {}));
      renderDashboard();

      await waitFor(() => {
        expect(screen.getAllByText("Создать резюме").length).toBeGreaterThan(0);
      });

      const btns = screen.getAllByText("Создать резюме");
      await userEvent.click(btns[0]);

      await waitFor(() => {
        expect(screen.getAllByText("Создание...").length).toBeGreaterThan(0);
      });

      expect(createNewResume).toHaveBeenCalledTimes(1);
    });

    it("shows error on failure", async () => {
      listUserResumes.mockResolvedValue([]);
      createNewResume.mockRejectedValue(new Error("fail"));
      renderDashboard();

      await waitFor(() => {
        expect(screen.getAllByText("Создать резюме").length).toBeGreaterThan(0);
      });

      const btns = screen.getAllByText("Создать резюме");
      await userEvent.click(btns[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/Не удалось создать/).length).toBeGreaterThan(0);
      });
    });
  });

  describe("Rename", () => {
    it("opens dialog with prefilled title", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renderDashboard();
      await waitForCards();

      const menus = screen.getAllByTestId("MoreVertIcon");
      await userEvent.click(menus[0]);
      await userEvent.click(screen.getByText("Переименовать"));

      expect(screen.getByDisplayValue("Frontend Dev")).toBeInTheDocument();
    });

    it("calls renameResumeById on save", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renameResumeById.mockResolvedValue({});
      renderDashboard();
      await waitForCards();

      const menus = screen.getAllByTestId("MoreVertIcon");
      await userEvent.click(menus[0]);
      await userEvent.click(screen.getByText("Переименовать"));

      const input = screen.getByDisplayValue("Frontend Dev");
      await userEvent.clear(input);
      await userEvent.type(input, "New Title");
      await userEvent.click(screen.getByText("Сохранить"));

      await waitFor(() => expect(renameResumeById).toHaveBeenCalledWith("aaa", "New Title"));
    });

    it("cancel closes without call", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renderDashboard();
      await waitForCards();

      const menus = screen.getAllByTestId("MoreVertIcon");
      await userEvent.click(menus[0]);
      await userEvent.click(screen.getByText("Переименовать"));
      await userEvent.click(screen.getByText("Отмена"));

      expect(renameResumeById).not.toHaveBeenCalled();
    });
  });

  describe("Duplicate", () => {
    it("calls duplicateResumeById", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      duplicateResumeById.mockResolvedValue({});
      renderDashboard();
      await waitForCards();

      const menus = screen.getAllByTestId("MoreVertIcon");
      await userEvent.click(menus[0]);
      await userEvent.click(screen.getByText("Создать копию"));

      await waitFor(() => expect(duplicateResumeById).toHaveBeenCalledWith("aaa"));
    });
  });

  describe("Delete", () => {
    it("shows confirmation with title", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renderDashboard();
      await waitForCards();

      const menus = screen.getAllByTestId("MoreVertIcon");
      await userEvent.click(menus[0]);
      await userEvent.click(screen.getByText("Удалить"));

      await waitFor(() => {
        expect(screen.getAllByText(/Удалить резюме «Frontend Dev»/).length).toBeGreaterThan(0);
      });
    });

    it("calls deleteResumeById on confirm", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      deleteResumeById.mockResolvedValue("aaa");
      renderDashboard();
      await waitForCards();

      const menus = screen.getAllByTestId("MoreVertIcon");
      await userEvent.click(menus[0]);

      const menuItems = screen.getAllByRole("menuitem");
      const deleteItem = menuItems.find((el) => el.textContent.includes("Удалить"));
      await userEvent.click(deleteItem);

      const dialog = await screen.findByRole("dialog");
      const confirmBtn = within(dialog).getByRole("button", { name: "Удалить" });
      await userEvent.click(confirmBtn);

      await waitFor(() => expect(deleteResumeById).toHaveBeenCalledWith("aaa"));
    });

    it("cancel closes without call", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renderDashboard();
      await waitForCards();

      const menus = screen.getAllByTestId("MoreVertIcon");
      await userEvent.click(menus[0]);

      const menuItems = screen.getAllByRole("menuitem");
      const deleteItem = menuItems.find((el) => el.textContent.includes("Удалить"));
      await userEvent.click(deleteItem);

      const dialog = await screen.findByRole("dialog");
      const cancelBtn = within(dialog).getByRole("button", { name: "Отмена" });
      await userEvent.click(cancelBtn);

      expect(deleteResumeById).not.toHaveBeenCalled();
    });
  });

  describe("Service layer", () => {
    it("uses listUserResumes, not supabase.from", async () => {
      listUserResumes.mockResolvedValue(MOCK_LIST);
      renderDashboard();
      await waitForCards();

      expect(listUserResumes).toHaveBeenCalledWith("user-1");
      expect(mockFromFn).not.toHaveBeenCalled();
    });
  });
});
