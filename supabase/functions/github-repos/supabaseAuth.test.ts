import { describe, expect, it, vi } from "vitest";
import {
  createSupabaseUserAuthenticator,
  extractBearerJwt,
  resolveSupabasePublicKey,
} from "./supabaseAuth.ts";

function requestWithAuthorization(authorization?: string) {
  const headers = new Headers();
  if (authorization) headers.set("Authorization", authorization);
  return new Request("https://example.test/github-repos", { headers });
}

function authClient(result: unknown) {
  const getUser = vi.fn().mockResolvedValue(result);
  return { client: { auth: { getUser } }, getUser };
}

describe("github-repos Supabase Auth validation", () => {
  it("requires a strict Bearer JWT", () => {
    expect(extractBearerJwt(requestWithAuthorization())).toBeNull();
    expect(extractBearerJwt(requestWithAuthorization("Token jwt"))).toBeNull();
    expect(extractBearerJwt(requestWithAuthorization("Bearer  jwt"))).toBeNull();
    expect(extractBearerJwt(requestWithAuthorization("Bearer jwt extra"))).toBeNull();
    expect(extractBearerJwt(requestWithAuthorization("Bearer jwt"))).toBe("jwt");
  });

  it("rejects an invalid JWT returned by Auth server", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { client, getUser } = authClient({
      data: { user: null },
      error: {
        status: 401,
        code: "bad_jwt",
        message: "Invalid JWT",
      },
    });
    const authenticate = createSupabaseUserAuthenticator(client);

    await expect(
      authenticate(requestWithAuthorization("Bearer invalid-jwt"))
    ).resolves.toBe(false);
    expect(getUser).toHaveBeenCalledWith("invalid-jwt");
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("rejects a response without a user", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { client } = authClient({ data: { user: null }, error: null });
    const authenticate = createSupabaseUserAuthenticator(client);

    await expect(
      authenticate(requestWithAuthorization("Bearer valid-jwt"))
    ).resolves.toBe(false);
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("accepts only a successful Auth server response with a user id", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { client, getUser } = authClient({
      data: { user: { id: "verified-user-id" } },
      error: null,
    });
    const authenticate = createSupabaseUserAuthenticator(client);

    await expect(
      authenticate(requestWithAuthorization("Bearer valid-jwt"))
    ).resolves.toBe(true);
    expect(getUser).toHaveBeenCalledOnce();
    expect(getUser).toHaveBeenCalledWith("valid-jwt");
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("prefers the hosted default publishable key over legacy anon", () => {
    const values = new Map([
      [
        "SUPABASE_PUBLISHABLE_KEYS",
        JSON.stringify({ default: "sb_publishable_default-value", web: "web-value" }),
      ],
      ["SUPABASE_ANON_KEY", "header.payload.signature"],
      ["SUPABASE_SERVICE_ROLE_KEY", "must-not-be-used"],
    ]);
    const reads: string[] = [];

    const selection = resolveSupabasePublicKey((name) => {
      reads.push(name);
      return values.get(name);
    });

    expect(selection.key).toBe("sb_publishable_default-value");
    expect(selection.diagnostics).toEqual({
      hasPublishableKeysEnv: true,
      publishableKeysParsed: true,
      publishableKeyNames: ["default", "web"],
      selectedKeySource: "publishable:default",
      selectedKeyLooksPublishable: true,
      selectedKeyLooksLegacyJwt: false,
    });
    expect(JSON.stringify(selection.diagnostics)).not.toContain(
      "sb_publishable_default-value"
    );
    expect(reads).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("falls back to legacy anon when the map has no default key", () => {
    const selection = resolveSupabasePublicKey((name) => {
      if (name === "SUPABASE_PUBLISHABLE_KEYS") {
        return JSON.stringify({ web: "must-not-be-selected" });
      }
      if (name === "SUPABASE_ANON_KEY") return "header.payload.signature";
      return undefined;
    });

    expect(selection.key).toBe("header.payload.signature");
    expect(selection.diagnostics.selectedKeySource).toBe("legacy:anon");
    expect(selection.diagnostics.selectedKeyLooksLegacyJwt).toBe(true);
    expect(JSON.stringify(selection.diagnostics)).not.toContain(
      "header.payload.signature"
    );
    expect(JSON.stringify(selection.diagnostics)).not.toContain(
      "must-not-be-selected"
    );
  });
});
