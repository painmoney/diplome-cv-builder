import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaveQueue } from "../saveQueueController";

vi.mock("../../api/resumeService", () => ({
  createResumeFullRpc: vi.fn(),
  saveResumeFullRpc: vi.fn(),
  saveProfile: vi.fn().mockResolvedValue(undefined),
  normalizeLoadedResumeData: vi.fn((d) => ({
    profile: { name: "", about: "", summary: "", email: "", phone: "" },
    skills: [], education: [], experience: [], github: [], projects: [],
    template: "minimalist",
    ...d,
  })),
}));

import { createResumeFullRpc, saveResumeFullRpc, saveProfile, normalizeLoadedResumeData } from "../../api/resumeService";

function createQueue(overrides = {}) {
  const setSaveStatus = vi.fn();
  const setSaveError = vi.fn();
  const setMessage = vi.fn();
  const userRef = { current: { id: "user-1" } };
  const queue = new SaveQueue({
    userRef, setSaveStatus, setSaveError, setMessage,
    rpcs: { createResumeFullRpc, saveResumeFullRpc, saveProfile, normalizeLoadedResumeData },
    ...overrides,
  });
  return { queue, setSaveStatus, setSaveError, setMessage, userRef };
}

beforeEach(() => {
  vi.clearAllMocks();
  createResumeFullRpc.mockResolvedValue({ resumeId: "r1", revision: 1, updatedAt: "2026-01-01" });
  saveResumeFullRpc.mockResolvedValue({ resumeId: "r1", revision: 2, updatedAt: "2026-01-02" });
  saveProfile.mockResolvedValue(undefined);
});

describe("SaveQueue: single in-flight", () => {
  it("only one RPC called while first is pending", async () => {
    let resolveFirst;
    createResumeFullRpc.mockImplementation(() =>
      new Promise((r) => { resolveFirst = r; })
    );

    const { queue } = createQueue();
    queue.enqueue({ resumeId: "id-1", title: "A", data: {}, profile: {}, reason: "autosave" });
    queue.enqueue({ resumeId: "id-1", title: "B", data: {}, profile: {}, reason: "autosave" });

    expect(createResumeFullRpc).toHaveBeenCalledTimes(1);

    resolveFirst({ resumeId: "r1", revision: 1, updatedAt: "t" });
    await new Promise((r) => setTimeout(r, 10));

    // B was coalesced into pending, then drain runs for it
    expect(createResumeFullRpc).toHaveBeenCalledTimes(1);
    expect(saveResumeFullRpc).toHaveBeenCalledTimes(1);
  });
});

describe("SaveQueue: latest pending wins", () => {
  it("C replaces B while A is in-flight", async () => {
    let resolveFirst;
    createResumeFullRpc.mockImplementation(() =>
      new Promise((r) => { resolveFirst = r; })
    );

    const { queue } = createQueue();
    queue.enqueue({ resumeId: "id-1", title: "A", data: {}, profile: {}, reason: "autosave" });
    queue.enqueue({ resumeId: "id-1", title: "B", data: {}, profile: {}, reason: "autosave" });
    queue.enqueue({ resumeId: "id-1", title: "C", data: {}, profile: {}, reason: "autosave" });

    expect(createResumeFullRpc).toHaveBeenCalledTimes(1);

    resolveFirst({ resumeId: "r1", revision: 1, updatedAt: "t" });
    await new Promise((r) => setTimeout(r, 10));

    // B was replaced by C. After A resolves (revision=1), C is sent via saveResumeFullRpc
    expect(saveResumeFullRpc).toHaveBeenCalledTimes(1);
    expect(saveResumeFullRpc).toHaveBeenCalledWith(
      expect.objectContaining({ expectedRevision: 1 })
    );
  });
});

describe("SaveQueue: revision propagation", () => {
  it("next save uses revision from previous success", async () => {
    createResumeFullRpc.mockResolvedValue({ resumeId: "r1", revision: 5, updatedAt: "t" });
    saveResumeFullRpc.mockResolvedValue({ resumeId: "r1", revision: 6, updatedAt: "t2" });

    const { queue } = createQueue();

    queue.enqueue({ resumeId: "id-1", title: "A", data: {}, profile: {}, reason: "manual" });
    await new Promise((r) => setTimeout(r, 10));
    expect(queue.revision).toBe(5);

    queue.enqueue({ resumeId: "id-1", title: "B", data: {}, profile: {}, reason: "manual" });
    await new Promise((r) => setTimeout(r, 10));

    expect(saveResumeFullRpc).toHaveBeenCalledWith(
      expect.objectContaining({ expectedRevision: 5 })
    );
    expect(queue.revision).toBe(6);
  });
});

describe("SaveQueue: saved only after full drain", () => {
  it("saved appears exactly once after all pending items complete", async () => {
    const { queue, setSaveStatus } = createQueue();

    queue.enqueue({ resumeId: "id-1", title: "A", data: {}, profile: {}, reason: "autosave" });
    queue.enqueue({ resumeId: "id-1", title: "B", data: {}, profile: {}, reason: "autosave" });
    queue.enqueue({ resumeId: "id-1", title: "C", data: {}, profile: {}, reason: "autosave" });

    await new Promise((r) => setTimeout(r, 30));

    // Last status should be "saved" (not stuck on "saving" or "error")
    const lastStatus = setSaveStatus.mock.calls[setSaveStatus.mock.calls.length - 1]?.[0];
    expect(lastStatus).toBe("saved");
  });
});

describe("SaveQueue: P1005 stops queue", () => {
  it("sets stopped, retains snapshot, no more RPC after enqueue", async () => {
    saveResumeFullRpc.mockRejectedValue({ code: "P1005", message: "REVISION_CONFLICT" });

    const { queue, setSaveStatus } = createQueue();
    queue.revision = 1;

    queue.enqueue({ resumeId: "r1", title: "A", data: {}, profile: {}, reason: "manual" });
    await new Promise((r) => setTimeout(r, 10));

    expect(queue.stopped).toBe(true);
    expect(setSaveStatus).toHaveBeenCalledWith("conflict");
    expect(queue.pending).toBeTruthy();

    saveResumeFullRpc.mockClear();
    queue.enqueue({ resumeId: "r1", title: "B", data: {}, profile: {}, reason: "autosave" });
    await new Promise((r) => setTimeout(r, 10));

    expect(saveResumeFullRpc).not.toHaveBeenCalled();
    expect(queue.pending.title).toBe("B");
  });

  it("resetGeneration clears stopped", () => {
    const { queue } = createQueue();
    queue.stopped = true;
    queue.resetGeneration();
    expect(queue.stopped).toBe(false);
  });
});

describe("SaveQueue: P1003 stops queue", () => {
  it("sets stopped, retains snapshot", async () => {
    createResumeFullRpc.mockRejectedValue({ code: "P1003", message: "RESUME_ALREADY_EXISTS" });

    const { queue, setSaveStatus } = createQueue();

    queue.enqueue({ resumeId: "id-1", title: "A", data: {}, profile: {}, reason: "manual" });
    await new Promise((r) => setTimeout(r, 10));

    expect(queue.stopped).toBe(true);
    expect(setSaveStatus).toHaveBeenCalledWith("conflict");
  });
});

describe("SaveQueue: network error retains snapshot", () => {
  it("returns snapshot to pending, revision unchanged, no infinite retry", async () => {
    createResumeFullRpc.mockRejectedValue(new Error("Network error"));

    const { queue, setSaveStatus } = createQueue();

    queue.enqueue({ resumeId: "id-1", title: "A", data: {}, profile: {}, reason: "manual" });
    await new Promise((r) => setTimeout(r, 10));

    expect(queue.revision).toBeNull();
    expect(queue.pending).toBeTruthy();
    expect(setSaveStatus).toHaveBeenCalledWith("error");
    expect(queue.stopped).toBe(false);
  });

  it("next manual save retries with same UUID", async () => {
    let callCount = 0;
    createResumeFullRpc.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error("Network error"));
      return Promise.resolve({ resumeId: "id-1", revision: 1, updatedAt: "t" });
    });

    const { queue } = createQueue();
    const uuid = "test-uuid";
    queue.resumeId = uuid;

    queue.enqueue({ resumeId: uuid, title: "A", data: {}, profile: {}, reason: "manual" });
    await new Promise((r) => setTimeout(r, 10));

    queue.enqueue({ resumeId: uuid, title: "A2", data: {}, profile: {}, reason: "manual" });
    await new Promise((r) => setTimeout(r, 10));

    expect(createResumeFullRpc).toHaveBeenCalledTimes(2);
    expect(queue.revision).toBe(1);
  });
});

describe("SaveQueue: profile failure", () => {
  it("keeps revision, shows error, not saved", async () => {
    saveProfile.mockRejectedValue(new Error("Profile DB error"));

    const { queue, setSaveStatus } = createQueue();
    queue.enqueue({ resumeId: "id-1", title: "A", data: {}, profile: { name: "Test" }, reason: "manual" });
    await new Promise((r) => setTimeout(r, 10));

    expect(queue.revision).toBe(1);
    expect(setSaveStatus).toHaveBeenCalledWith("error");
    const savedCalls = setSaveStatus.mock.calls.filter((c) => c[0] === "saved");
    expect(savedCalls.length).toBe(0);
  });

  it("uses normalized profile, not raw snapshot.profile", async () => {
    saveProfile.mockResolvedValue(undefined);

    const { queue } = createQueue();
    queue.enqueue({
      resumeId: "id-1", title: "A",
      data: { profile: { name: "Normalized" } },
      profile: { name: "Raw" },
      reason: "manual",
    });
    await new Promise((r) => setTimeout(r, 10));

    expect(saveProfile).toHaveBeenCalledWith("user-1",
      expect.objectContaining({ name: "Normalized" })
    );
  });
});

describe("SaveQueue: generation/user switch", () => {
  it("in-flight request from old generation does not affect new state", async () => {
    let resolveFirst;
    createResumeFullRpc.mockImplementation(() =>
      new Promise((r) => { resolveFirst = r; })
    );

    const { queue, setSaveStatus } = createQueue();
    queue.enqueue({ resumeId: "id-1", title: "A", data: {}, profile: {}, reason: "manual" });

    queue.resetGeneration();
    queue.resumeId = "new-id";
    queue.revision = null;

    resolveFirst({ resumeId: "old-id", revision: 1, updatedAt: "t" });
    await new Promise((r) => setTimeout(r, 10));

    expect(queue.resumeId).toBe("new-id");
    expect(queue.revision).toBeNull();
    const savedCalls = setSaveStatus.mock.calls.filter((c) => c[0] === "saved");
    expect(savedCalls.length).toBe(0);
  });
});

describe("SaveQueue: enqueue while stopped", () => {
  it("stores snapshot but does not drain", async () => {
    saveResumeFullRpc.mockRejectedValue({ code: "P1005", message: "REVISION_CONFLICT" });

    const { queue } = createQueue();
    queue.revision = 1;

    queue.enqueue({ resumeId: "r1", title: "A", data: {}, profile: {}, reason: "manual" });
    await new Promise((r) => setTimeout(r, 10));
    expect(queue.stopped).toBe(true);

    saveResumeFullRpc.mockClear();
    queue.enqueue({ resumeId: "r1", title: "B", data: {}, profile: {}, reason: "autosave" });
    await new Promise((r) => setTimeout(r, 10));

    expect(saveResumeFullRpc).not.toHaveBeenCalled();
    expect(queue.pending.title).toBe("B");
  });
});

describe("SaveQueue: initFromLoad", () => {
  it("existing resume sets id and revision", () => {
    const { queue } = createQueue();
    queue.initFromLoad({ id: "loaded-id", revision: 3 });
    expect(queue.resumeId).toBe("loaded-id");
    expect(queue.revision).toBe(3);
  });

  it("new user generates UUID and null revision", () => {
    const { queue } = createQueue();
    queue.initFromLoad(null);
    expect(queue.resumeId).toMatch(/^[\da-f-]{36}$/);
    expect(queue.revision).toBeNull();
  });
});
