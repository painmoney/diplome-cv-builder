import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createResumeFullRpc,
  saveResumeFullRpc,
  normalizeLoadedResumeData,
} from "../../api/resumeService";

// Mock supabase client
vi.mock("../../api/supabaseClient", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

import { supabase } from "../../api/supabaseClient";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createResumeFullRpc", () => {
  it("calls correct RPC name with named args", async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ out_resume_id: "uuid-1", out_revision: 1, out_updated_at: "2026-01-01T00:00:00Z" }],
      error: null,
    });

    const result = await createResumeFullRpc({
      resumeId: "uuid-1",
      title: "Test",
      template: "minimalist",
      data: { skills: [] },
    });

    expect(supabase.rpc).toHaveBeenCalledWith("create_resume_full", {
      p_resume_id: "uuid-1",
      p_title: "Test",
      p_template: "minimalist",
      p_data: { skills: [] },
    });
    expect(result).toEqual({
      resumeId: "uuid-1",
      revision: 1,
      updatedAt: "2026-01-01T00:00:00Z",
    });
  });

  it("maps table result correctly", async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ out_resume_id: "id-2", out_revision: 3, out_updated_at: "2026-06-21T12:00:00Z" }],
      error: null,
    });

    const result = await createResumeFullRpc({
      resumeId: "id-2", title: "X", template: "minimalist", data: {},
    });

    expect(result.resumeId).toBe("id-2");
    expect(result.revision).toBe(3);
    expect(result.updatedAt).toBe("2026-06-21T12:00:00Z");
  });

  it("preserves database error code", async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: "P1003", message: "RESUME_ALREADY_EXISTS", details: null, hint: null },
    });

    await expect(
      createResumeFullRpc({ resumeId: "x", title: "X", template: "minimalist", data: {} })
    ).rejects.toMatchObject({ code: "P1003" });
  });

  it("handles single object result (not array)", async () => {
    supabase.rpc.mockResolvedValue({
      data: { out_resume_id: "id-3", out_revision: 1, out_updated_at: "2026-01-01" },
      error: null,
    });

    const result = await createResumeFullRpc({
      resumeId: "id-3", title: "X", template: "minimalist", data: {},
    });
    expect(result.resumeId).toBe("id-3");
  });
});

describe("saveResumeFullRpc", () => {
  it("calls correct RPC with expected_revision", async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ out_resume_id: "uuid-1", out_revision: 2, out_updated_at: "2026-01-01" }],
      error: null,
    });

    const result = await saveResumeFullRpc({
      resumeId: "uuid-1",
      title: "Updated",
      template: "academic",
      data: { skills: [{ name: "React" }] },
      expectedRevision: 1,
    });

    expect(supabase.rpc).toHaveBeenCalledWith("save_resume_full", {
      p_resume_id: "uuid-1",
      p_title: "Updated",
      p_template: "academic",
      p_data: { skills: [{ name: "React" }] },
      p_expected_revision: 1,
    });
    expect(result.revision).toBe(2);
  });

  it("preserves P1005 revision conflict error", async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: "P1005", message: "REVISION_CONFLICT" },
    });

    await expect(
      saveResumeFullRpc({ resumeId: "x", title: "X", template: "minimalist", data: {}, expectedRevision: 1 })
    ).rejects.toMatchObject({ code: "P1005" });
  });

  it("preserves P1002 invalid payload error", async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: "P1002", message: "INVALID_RESUME_PAYLOAD" },
    });

    await expect(
      saveResumeFullRpc({ resumeId: "x", title: "X", template: "minimalist", data: {}, expectedRevision: 1 })
    ).rejects.toMatchObject({ code: "P1002" });
  });
});

describe("normalizeLoadedResumeData", () => {
  it("returns defaults for empty input", () => {
    const result = normalizeLoadedResumeData({});
    expect(result.skills).toEqual([]);
    expect(result.education).toEqual([]);
    expect(result.experience).toEqual([]);
    expect(result.github).toEqual([]);
    expect(result.projects).toEqual([]);
    expect(result.template).toBe("minimalist");
    expect(result.profile).toBeDefined();
  });

  it("preserves existing data", () => {
    const result = normalizeLoadedResumeData({
      skills: [{ name: "React" }],
      template: "academic",
    });
    expect(result.skills).toEqual([{ name: "React" }]);
    expect(result.template).toBe("academic");
  });

  it("normalizes profile about/summary", () => {
    const result = normalizeLoadedResumeData({
      profile: { about: "Hello", summary: undefined },
    });
    expect(result.profile.about).toBe("Hello");
    expect(result.profile.summary).toBe("Hello");
  });
});
