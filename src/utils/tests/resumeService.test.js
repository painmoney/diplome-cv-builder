import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createResumeFullRpc,
  saveResumeFullRpc,
  normalizeLoadedResumeData,
  loadUserResume,
  listUserResumes,
  loadResumeById,
  renameResumeById,
  duplicateResumeById,
  deleteResumeById,
} from "../../api/resumeService";

// ── Mock: supabase query builder contract ────────────────
// Real Supabase: `await from().select().eq().maybeSingle()` resolves to { data, error }
// Real Supabase: `await from().select().eq().order()` resolves to { data, error }
// Real Supabase: `await from().delete().eq().select().maybeSingle()` resolves to { data, error }
//
// This mock makes the entire chain thenable, resolving to { data, error }.
// maybeSingle() additionally enforces single-row semantics on the resolved data.

function createMockQuery(result) {
  // result = { data: row_or_null, error: err_or_null }
  const chain = {};
  for (const m of ["select", "eq", "order", "limit"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.maybeSingle = vi.fn().mockImplementation(() =>
    Promise.resolve(result)
  );
  chain.single = vi.fn().mockImplementation(() =>
    Promise.resolve(result)
  );
  // The whole chain is thenable — `await chain` resolves to result
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("../../api/supabaseClient", () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));



beforeEach(() => {
  vi.clearAllMocks();
});

// ── createResumeFullRpc ─────────────────────────────────

describe("createResumeFullRpc", () => {
  it("calls correct RPC name with named args", async () => {
    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "uuid-1", out_revision: 1, out_updated_at: "2026-01-01T00:00:00Z" }],
      error: null,
    });

    const result = await createResumeFullRpc({
      resumeId: "uuid-1",
      title: "Test",
      template: "minimalist",
      data: { skills: [] },
    });

    expect(mockRpc).toHaveBeenCalledWith("create_resume_full", {
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
    mockRpc.mockResolvedValue({
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
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: "P1003", message: "RESUME_ALREADY_EXISTS", details: null, hint: null },
    });

    await expect(
      createResumeFullRpc({ resumeId: "x", title: "X", template: "minimalist", data: {} })
    ).rejects.toMatchObject({ code: "P1003" });
  });

  it("handles single object result (not array)", async () => {
    mockRpc.mockResolvedValue({
      data: { out_resume_id: "id-3", out_revision: 1, out_updated_at: "2026-01-01" },
      error: null,
    });

    const result = await createResumeFullRpc({
      resumeId: "id-3", title: "X", template: "minimalist", data: {},
    });
    expect(result.resumeId).toBe("id-3");
  });
});

// ── saveResumeFullRpc ───────────────────────────────────

describe("saveResumeFullRpc", () => {
  it("calls correct RPC with expected_revision", async () => {
    mockRpc.mockResolvedValue({
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

    expect(mockRpc).toHaveBeenCalledWith("save_resume_full", {
      p_resume_id: "uuid-1",
      p_title: "Updated",
      p_template: "academic",
      p_data: { skills: [{ name: "React" }] },
      p_expected_revision: 1,
    });
    expect(result.revision).toBe(2);
  });

  it("preserves P1005 revision conflict error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: "P1005", message: "REVISION_CONFLICT" },
    });

    await expect(
      saveResumeFullRpc({ resumeId: "x", title: "X", template: "minimalist", data: {}, expectedRevision: 1 })
    ).rejects.toMatchObject({ code: "P1005" });
  });

  it("preserves P1002 invalid payload error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: "P1002", message: "INVALID_RESUME_PAYLOAD" },
    });

    await expect(
      saveResumeFullRpc({ resumeId: "x", title: "X", template: "minimalist", data: {}, expectedRevision: 1 })
    ).rejects.toMatchObject({ code: "P1002" });
  });
});

// ── normalizeLoadedResumeData ────────────────────────────

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

// ── loadUserResume (legacy) ─────────────────────────────

describe("loadUserResume (legacy)", () => {
  it("orders updated_at DESC then id ASC", async () => {
    const chain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await loadUserResume("user-1");

    expect(chain.order).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(chain.order).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("limits query to 1", async () => {
    const chain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await loadUserResume("user-1");

    expect(chain.limit).toHaveBeenCalledWith(1);
  });

  it("uses maybeSingle", async () => {
    const chain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await loadUserResume("user-1");

    expect(chain.maybeSingle).toHaveBeenCalled();
  });

  it("returns null for zero rows", async () => {
    const chain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await loadUserResume("user-1");
    expect(result).toBeNull();
  });

  it("returns normalized resume for one row", async () => {
    const row = {
      id: "r1", user_id: "u1", title: "T", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { skills: [{ name: "React" }], template: "minimalist" },
    };
    const chain = createMockQuery({ data: row, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await loadUserResume("user-1");
    expect(result.id).toBe("r1");
    expect(result.data.skills).toEqual([{ name: "React" }]);
  });

  it("throws on query error", async () => {
    const chain = createMockQuery({ data: null, error: { message: "db error" } });
    mockFrom.mockReturnValue(chain);

    await expect(loadUserResume("user-1")).rejects.toThrow();
  });
});

// ── listUserResumes ──────────────────────────────────────

describe("listUserResumes", () => {
  it("returns empty array for missing userId", async () => {
    const result = await listUserResumes(null);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty string userId", async () => {
    const result = await listUserResumes("");
    expect(result).toEqual([]);
  });

  it("selects summary columns only", async () => {
    const chain = createMockQuery({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await listUserResumes("user-1");

    expect(chain.select).toHaveBeenCalledWith("id, title, template, revision, created_at, updated_at");
  });

  it("filters by user_id", async () => {
    const chain = createMockQuery({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await listUserResumes("user-1");

    expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("orders by updated_at DESC", async () => {
    const chain = createMockQuery({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await listUserResumes("user-1");

    expect(chain.order).toHaveBeenCalledWith("updated_at", { ascending: false });
  });

  it("uses stable tie-breaker id ASC", async () => {
    const chain = createMockQuery({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await listUserResumes("user-1");

    expect(chain.order).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("maps snake_case timestamps to camelCase", async () => {
    const rows = [{
      id: "r1", title: "T", template: "minimalist", revision: 1,
      created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z",
    }];
    const chain = createMockQuery({ data: rows, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await listUserResumes("user-1");
    expect(result[0].resumeId).toBe("r1");
    expect(result[0].createdAt).toBe("2026-01-01T00:00:00Z");
    expect(result[0].updatedAt).toBe("2026-01-02T00:00:00Z");
  });

  it("returns [] for no rows", async () => {
    const chain = createMockQuery({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await listUserResumes("user-1");
    expect(result).toEqual([]);
  });

  it("preserves Supabase error code/message", async () => {
    const chain = createMockQuery({ data: null, error: { code: "42P01", message: "relation not found" } });
    mockFrom.mockReturnValue(chain);

    await expect(listUserResumes("user-1")).rejects.toMatchObject({ code: "42P01" });
  });

  it("does not select data column", async () => {
    const chain = createMockQuery({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await listUserResumes("user-1");

    const selectArg = chain.select.mock.calls[0][0];
    expect(selectArg).not.toContain("data");
  });
});

// ── loadResumeById ───────────────────────────────────────

describe("loadResumeById", () => {
  it("filters by exact id", async () => {
    const chain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await loadResumeById("r1");

    expect(chain.eq).toHaveBeenCalledWith("id", "r1");
  });

  it("uses maybeSingle", async () => {
    const chain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await loadResumeById("r1");

    expect(chain.maybeSingle).toHaveBeenCalled();
  });

  it("normalizes resume data", async () => {
    const row = {
      id: "r1", user_id: "u1", title: "T", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { skills: [{ name: "React" }], template: "minimalist" },
    };
    const chain = createMockQuery({ data: row, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await loadResumeById("r1");
    expect(result.data.skills).toEqual([{ name: "React" }]);
    expect(result.data.template).toBe("minimalist");
  });

  it("maps metadata to camelCase", async () => {
    const row = {
      id: "r1", user_id: "u1", title: "T", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: {},
    };
    const chain = createMockQuery({ data: row, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await loadResumeById("r1");
    expect(result.resumeId).toBe("r1");
    expect(result.userId).toBe("u1");
    expect(result.createdAt).toBe("2026-01-01");
    expect(result.updatedAt).toBe("2026-01-02");
  });

  it("returns null for no row", async () => {
    const chain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await loadResumeById("nonexistent");
    expect(result).toBeNull();
  });

  it("foreign/not-found represented identically as null", async () => {
    const chain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await loadResumeById("foreign-id");
    expect(result).toBeNull();
  });

  it("preserves real query errors", async () => {
    const chain = createMockQuery({ data: null, error: { message: "network error" } });
    mockFrom.mockReturnValue(chain);

    await expect(loadResumeById("r1")).rejects.toThrow();
  });
});

// ── renameResumeById ─────────────────────────────────────

describe("renameResumeById", () => {
  it("loads fresh source and calls saveResumeFullRpc", async () => {
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Old", template: "minimalist",
      revision: 2, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { skills: [{ name: "React" }], template: "minimalist" },
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "r1", out_revision: 3, out_updated_at: "2026-01-03" }],
      error: null,
    });

    const result = await renameResumeById("r1", "New Title");

    expect(result.revision).toBe(3);
    expect(mockRpc).toHaveBeenCalledWith("save_resume_full", expect.objectContaining({
      p_resume_id: "r1",
      p_title: "New Title",
      p_expected_revision: 2,
    }));
  });

  it("does not call saveProfile", async () => {
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Old", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { template: "minimalist" },
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "r1", out_revision: 2, out_updated_at: "t" }],
      error: null,
    });

    await renameResumeById("r1", "New");

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith("save_resume_full", expect.anything());
  });

  it("null source throws P1004", async () => {
    const loadChain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    await expect(renameResumeById("nonexistent", "X")).rejects.toMatchObject({ code: "P1004" });
  });

  it("P1005 from save RPC propagates", async () => {
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Old", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { template: "minimalist" },
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: null,
      error: { code: "P1005", message: "REVISION_CONFLICT" },
    });

    await expect(renameResumeById("r1", "X")).rejects.toMatchObject({ code: "P1005" });
  });

  it("empty title normalizes to Untitled", async () => {
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Old", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { template: "minimalist" },
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "r1", out_revision: 2, out_updated_at: "t" }],
      error: null,
    });

    await renameResumeById("r1", "   ");

    expect(mockRpc).toHaveBeenCalledWith("save_resume_full", expect.objectContaining({
      p_title: "Untitled",
    }));
  });
});

// ── duplicateResumeById ──────────────────────────────────

describe("duplicateResumeById", () => {
  it("loads source by ID", async () => {
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Original", template: "academic",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { skills: [{ name: "React" }], template: "academic", profile: { name: "A" } },
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "new-uuid", out_revision: 1, out_updated_at: "t" }],
      error: null,
    });

    await duplicateResumeById("r1");

    expect(mockRpc).toHaveBeenCalledWith("create_resume_full", expect.objectContaining({
      p_template: "academic",
    }));
  });

  it("generates new UUID", async () => {
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Original", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { template: "minimalist" },
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "new-id", out_revision: 1, out_updated_at: "t" }],
      error: null,
    });

    const result = await duplicateResumeById("r1");

    const callArgs = mockRpc.mock.calls[0][1];
    expect(callArgs.p_resume_id).not.toBe("r1");
    expect(typeof callArgs.p_resume_id).toBe("string");
    expect(callArgs.p_resume_id.length).toBe(36);
    expect(result.revision).toBe(1);
  });

  it("copies template and complete data including profile and projects", async () => {
    const sourceData = {
      skills: [{ name: "React" }], template: "academic",
      profile: { name: "A" }, projects: [{ id: "p1", name: "Proj" }],
    };
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Original", template: "academic",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: sourceData,
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "new-id", out_revision: 1, out_updated_at: "t" }],
      error: null,
    });

    await duplicateResumeById("r1");

    const callArgs = mockRpc.mock.calls[0][1];
    expect(callArgs.p_data.profile.name).toBe("A");
    expect(callArgs.p_data.projects).toEqual([{ id: "p1", name: "Proj" }]);
  });

  it("uses '<title> (копия)' as default title", async () => {
    const sourceRow = {
      id: "r1", user_id: "u1", title: "My Resume", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { template: "minimalist" },
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "new-id", out_revision: 1, out_updated_at: "t" }],
      error: null,
    });

    await duplicateResumeById("r1");

    expect(mockRpc).toHaveBeenCalledWith("create_resume_full", expect.objectContaining({
      p_title: "My Resume (копия)",
    }));
  });

  it("supports explicit title option", async () => {
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Original", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { template: "minimalist" },
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "new-id", out_revision: 1, out_updated_at: "t" }],
      error: null,
    });

    await duplicateResumeById("r1", { title: "Custom Title" });

    expect(mockRpc).toHaveBeenCalledWith("create_resume_full", expect.objectContaining({
      p_title: "Custom Title",
    }));
  });

  it("null source throws P1004", async () => {
    const loadChain = createMockQuery({ data: null, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    await expect(duplicateResumeById("nonexistent")).rejects.toMatchObject({ code: "P1004" });
  });

  it("create RPC error propagates", async () => {
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Original", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: { template: "minimalist" },
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: null,
      error: { code: "P1002", message: "INVALID_RESUME_PAYLOAD" },
    });

    await expect(duplicateResumeById("r1")).rejects.toMatchObject({ code: "P1002" });
  });

  it("source object is not mutated", async () => {
    const sourceData = { skills: [{ name: "React" }], template: "minimalist" };
    const sourceRow = {
      id: "r1", user_id: "u1", title: "Original", template: "minimalist",
      revision: 1, created_at: "2026-01-01", updated_at: "2026-01-02",
      data: sourceData,
    };
    const loadChain = createMockQuery({ data: sourceRow, error: null });
    mockFrom.mockReturnValueOnce(loadChain);

    mockRpc.mockResolvedValue({
      data: [{ out_resume_id: "new-id", out_revision: 1, out_updated_at: "t" }],
      error: null,
    });

    const originalTitle = sourceRow.title;
    await duplicateResumeById("r1");

    expect(sourceRow.title).toBe(originalTitle);
  });
});

// ── deleteResumeById ─────────────────────────────────────

describe("deleteResumeById", () => {
  function createDeleteChain(result) {
    const chain = {};
    chain.delete = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(result));
    chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    return chain;
  }

  it("deletes filtered by exact id", async () => {
    const chain = createDeleteChain({ data: { id: "r1" }, error: null });
    mockFrom.mockReturnValue(chain);

    const result = await deleteResumeById("r1");

    expect(result).toBe("r1");
  });

  it("chains select('id') and maybeSingle", async () => {
    const chain = createDeleteChain({ data: { id: "r1" }, error: null });
    mockFrom.mockReturnValue(chain);

    await deleteResumeById("r1");

    expect(chain.select).toHaveBeenCalledWith("id");
    expect(chain.maybeSingle).toHaveBeenCalled();
  });

  it("zero-row delete throws P1004", async () => {
    const chain = createDeleteChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await expect(deleteResumeById("nonexistent")).rejects.toMatchObject({ code: "P1004" });
  });

  it("Supabase error propagated", async () => {
    const chain = createDeleteChain({ data: null, error: { message: "db error" } });
    mockFrom.mockReturnValue(chain);

    await expect(deleteResumeById("r1")).rejects.toThrow();
  });

  it("does not issue child-table deletes", async () => {
    const chain = createDeleteChain({ data: { id: "r1" }, error: null });
    mockFrom.mockReturnValue(chain);

    await deleteResumeById("r1");

    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("resumes");
  });
});
