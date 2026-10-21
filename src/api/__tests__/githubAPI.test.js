import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "../supabaseClient";
import { fetchGitHubRepos } from "../githubAPI";

vi.mock("../supabaseClient", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("fetchGitHubRepos error messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows message instead of the technical error code", async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: {
        context: new Response(
          JSON.stringify({
            error: "GITHUB_TOKEN_INVALID",
            message:
              "GitHub отклонил серверный токен. Он мог истечь, быть отозван или стать недействительным.",
          }),
          { status: 502 }
        ),
      },
    });

    await expect(fetchGitHubRepos("octocat")).rejects.toThrow(
      "GitHub отклонил серверный токен. Он мог истечь, быть отозван или стать недействительным."
    );
  });

  it("also prefers message when an error arrives in data", async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: {
        error: "GITHUB_RATE_LIMIT",
        message: "Лимит запросов GitHub временно исчерпан. Попробуйте позже.",
      },
      error: null,
    });

    await expect(fetchGitHubRepos("octocat")).rejects.toThrow(
      "Лимит запросов GitHub временно исчерпан. Попробуйте позже."
    );
  });
});
