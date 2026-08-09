import { describe, expect, it, vi } from "vitest";

import { prepareResumeDataForPdf } from "../pdfImage";

describe("prepareResumeDataForPdf", () => {
  it("keeps resume data unchanged when there is no photo", async () => {
    const resumeData = { profile: { name: "Иван", photo: "" } };

    await expect(prepareResumeDataForPdf(resumeData)).resolves.toEqual({
      data: resumeData,
      photoOmitted: false,
    });
  });

  it("converts a WebP avatar to a PDF-compatible data URL", async () => {
    const resumeData = {
      profile: { name: "Иван", photo: "https://cdn.test/avatar.webp" },
    };
    const converter = vi.fn().mockResolvedValue("data:image/png;base64,converted");

    const result = await prepareResumeDataForPdf(resumeData, converter);

    expect(converter).toHaveBeenCalledWith("https://cdn.test/avatar.webp");
    expect(result.data.profile.photo).toBe("data:image/png;base64,converted");
    expect(result.photoOmitted).toBe(false);
    expect(resumeData.profile.photo).toBe("https://cdn.test/avatar.webp");
  });

  it("omits an unreadable photo without blocking PDF export", async () => {
    const resumeData = {
      profile: { name: "Иван", photo: "https://cdn.test/avatar.webp" },
    };
    const converter = vi.fn().mockRejectedValue(new Error("network"));

    const result = await prepareResumeDataForPdf(resumeData, converter);

    expect(result.data.profile.photo).toBe("");
    expect(result.photoOmitted).toBe(true);
  });
});
