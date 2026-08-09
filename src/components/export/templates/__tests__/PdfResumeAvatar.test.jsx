import { describe, expect, it } from "vitest";

import PdfResumeAvatar from "../PdfResumeAvatar";

describe("PdfResumeAvatar", () => {
  it("passes the profile photo to the PDF image", () => {
    const image = PdfResumeAvatar({
      profile: { photo: "https://cdn.test/avatar.webp" },
    });

    expect(image.props.src).toBe("https://cdn.test/avatar.webp");
  });

  it("returns nothing when the profile has no photo", () => {
    expect(PdfResumeAvatar({ profile: {} })).toBeNull();
  });

  it("uses a square frame when selected", () => {
    const image = PdfResumeAvatar({
      profile: { photo: "https://cdn.test/avatar.webp", avatarShape: "square" },
    });

    expect(image.props.style[1].borderRadius).toBe(4);
  });
});
