import { describe, it, expect } from "vitest";
import { autosaveFingerprint } from "../autosaveFingerprint";

describe("autosaveFingerprint", () => {
  const dataA = { skills: [{ name: "React" }], template: "minimalist" };
  const dataB = { skills: [{ name: "Vue" }], template: "minimalist" };

  it("same title + same data → same fingerprint", () => {
    expect(autosaveFingerprint("Title", dataA)).toBe(autosaveFingerprint("Title", dataA));
  });

  it("different title → different fingerprint", () => {
    expect(autosaveFingerprint("Old", dataA)).not.toBe(autosaveFingerprint("New", dataA));
  });

  it("different data → different fingerprint", () => {
    expect(autosaveFingerprint("Title", dataA)).not.toBe(autosaveFingerprint("Title", dataB));
  });

  it("null title treated as empty string", () => {
    expect(autosaveFingerprint(null, dataA)).toBe(autosaveFingerprint("", dataA));
  });

  it("undefined title treated as empty string", () => {
    expect(autosaveFingerprint(undefined, dataA)).toBe(autosaveFingerprint("", dataA));
  });

  it("detects title-only change", () => {
    const hydrated = autosaveFingerprint("Старое", dataA);
    const current = autosaveFingerprint("Новое", dataA);
    expect(hydrated).not.toBe(current);
  });

  it("no change after hydration", () => {
    const hydrated = autosaveFingerprint("Моё IT-резюме", dataA);
    const current = autosaveFingerprint("Моё IT-резюме", dataA);
    expect(hydrated).toBe(current);
  });
});
