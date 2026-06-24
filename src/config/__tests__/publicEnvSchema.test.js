import { describe, it, expect } from "vitest";
import { validatePublicEnv } from "../publicEnvSchema";

describe("validatePublicEnv", () => {
  const validRemote = {
    VITE_SUPABASE_URL: "https://abc123.supabase.co",
    VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.test",
    MODE: "production",
  };

  const validLocal = {
    VITE_SUPABASE_URL: "http://localhost:54321",
    VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.test",
    MODE: "development",
  };

  it("accepts valid remote HTTPS URL and anon key", () => {
    const result = validatePublicEnv(validRemote);
    expect(result.supabaseUrl).toBe("https://abc123.supabase.co");
    expect(result.supabaseClientKey).toBe("eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.test");
    expect(result.mode).toBe("production");
  });

  it("accepts valid localhost HTTP URL", () => {
    const result = validatePublicEnv(validLocal);
    expect(result.supabaseUrl).toBe("http://localhost:54321");
  });

  it("throws when URL is missing", () => {
    expect(() => validatePublicEnv({ ...validRemote, VITE_SUPABASE_URL: undefined })).toThrow("VITE_SUPABASE_URL is required");
  });

  it("throws when key is missing", () => {
    expect(() => validatePublicEnv({ ...validRemote, VITE_SUPABASE_ANON_KEY: "" })).toThrow("VITE_SUPABASE_ANON_KEY is required");
  });

  it("throws for remote HTTP URL", () => {
    expect(() => validatePublicEnv({ ...validRemote, VITE_SUPABASE_URL: "http://abc123.supabase.co" })).toThrow("https://");
  });

  it("rejects service-role key prefix", () => {
    expect(() => validatePublicEnv({ ...validRemote, VITE_SUPABASE_ANON_KEY: "sb_secret_abc123" })).toThrow("service-role");
  });

  it("rejects JWT with role=service_role", () => {
    const serviceRoleJwt = "eyJhbGciOiJIUzI1NiJ9." + btoa(JSON.stringify({ role: "service_role" })) + ".sig";
    expect(() => validatePublicEnv({ ...validRemote, VITE_SUPABASE_ANON_KEY: serviceRoleJwt })).toThrow("service-role");
  });

  it("accepts JWT with role=anon", () => {
    const anonJwt = "eyJhbGciOiJIUzI1NiJ9." + btoa(JSON.stringify({ role: "anon" })) + ".sig";
    const result = validatePublicEnv({ ...validRemote, VITE_SUPABASE_ANON_KEY: anonJwt });
    expect(result.supabaseClientKey).toBe(anonJwt);
  });

  it("error message does not contain the raw key value", () => {
    const secret = "sb_secret_ABCDEF123456";
    try {
      validatePublicEnv({ VITE_SUPABASE_URL: "https://x.supabase.co", VITE_SUPABASE_ANON_KEY: secret });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err.message).not.toContain(secret);
    }
  });

  it("does not leak extra env values into config", () => {
    const result = validatePublicEnv({ ...validRemote, EXTRA_KEY: "extra" });
    expect(result).not.toHaveProperty("EXTRA_KEY");
    expect(Object.keys(result)).toEqual(["supabaseUrl", "supabaseClientKey", "mode"]);
  });

  it("result is frozen", () => {
    const result = validatePublicEnv(validRemote);
    expect(Object.isFrozen(result)).toBe(true);
  });
});
