import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAvatarUrl, uploadAvatar } from "../storage";

const { uploadMock, getPublicUrlMock, fromMock } = vi.hoisted(() => ({
  uploadMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("../supabaseClient", () => ({
  supabase: {
    storage: {
      from: fromMock,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  fromMock.mockReturnValue({
    upload: uploadMock,
    getPublicUrl: getPublicUrlMock,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("avatar storage", () => {
  it("uploads replacements to a new immutable path", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123456789);
    uploadMock.mockResolvedValue({
      data: { path: "user-1/avatar-123456789.webp" },
      error: null,
    });
    const file = new File(["avatar"], "avatar.webp", { type: "image/webp" });

    const result = await uploadAvatar("user-1", file);

    expect(uploadMock).toHaveBeenCalledWith(
      "user-1/avatar-123456789.webp",
      file,
      {
        upsert: false,
        contentType: "image/webp",
        cacheControl: "31536000",
      }
    );
    expect(result.path).toBe("user-1/avatar-123456789.webp");
  });

  it("builds the public URL for the exact uploaded version", () => {
    getPublicUrlMock.mockReturnValue({
      data: { publicUrl: "https://cdn.test/user-1/avatar-123.webp" },
    });

    const result = getAvatarUrl("user-1", "avatar-123.webp");

    expect(getPublicUrlMock).toHaveBeenCalledWith(
      "user-1/avatar-123.webp"
    );
    expect(result).toBe("https://cdn.test/user-1/avatar-123.webp");
  });
});
