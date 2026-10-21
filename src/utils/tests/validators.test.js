import { describe, expect, it } from "vitest";
import { isValidAge, validateProfile } from "../validators";

describe("optional profile age validation", () => {
  it("allows an empty age", () => {
    expect(isValidAge("")).toBe(true);
    expect(validateProfile({ age: "" })).toEqual({});
  });

  it.each([14, 22, 100])("accepts integer age %s", (age) => {
    expect(isValidAge(age)).toBe(true);
    expect(validateProfile({ age })).toEqual({});
  });

  it.each([-1, 13, 22.5, 101])("rejects invalid age %s", (age) => {
    expect(isValidAge(age)).toBe(false);
    expect(validateProfile({ age })).toHaveProperty("age");
  });
});
