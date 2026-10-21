import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createGitHubReposHandler } from "./handler.ts";

const functionDirectory = resolve("supabase/functions/github-repos");
const configPath = resolve("supabase/config.toml");

function postRequest(token?: string) {
  const headers = new Headers({ "Content-Type": "application/json" });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return new Request("http://localhost/github-repos", {
    method: "POST",
    headers,
    body: JSON.stringify({ username: "octocat" }),
  });
}

function createHandler({
  authenticated = true,
  githubToken = "server-github-token",
  expiresAt,
  now = "2026-08-09T12:00:00Z",
} = {}) {
  const authenticateUser = vi.fn().mockResolvedValue(authenticated);
  const fetchImpl = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify([
        {
          name: "hello-world",
          description: "Example repository",
          html_url: "https://github.com/octocat/hello-world",
          stargazers_count: 7,
          language: "TypeScript",
          forks_count: 2,
        },
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  );
  const handler = createGitHubReposHandler({
    authenticateUser,
    fetchImpl,
    getGitHubToken: () => githubToken,
    getGitHubTokenExpiresAt: () => expiresAt,
    now: () => new Date(now),
  });

  return { authenticateUser, fetchImpl, handler };
}

describe("github-repos authentication", () => {
  it("allows OPTIONS without a JWT", async () => {
    const { authenticateUser, fetchImpl, handler } = createHandler();

    const response = await handler(
      new Request("http://localhost/github-repos", { method: "OPTIONS" })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
      "authorization"
    );
    expect(authenticateUser).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects POST without an Authorization header", async () => {
    const { authenticateUser, fetchImpl, handler } = createHandler();

    const response = await handler(postRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(authenticateUser).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a malformed Authorization header", async () => {
    const { authenticateUser, fetchImpl, handler } = createHandler();
    const request = postRequest();
    request.headers.set("Authorization", "Bearer invalid jwt");

    const response = await handler(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(authenticateUser).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects an invalid user JWT before calling GitHub", async () => {
    const { authenticateUser, fetchImpl, handler } = createHandler({
      authenticated: false,
    });

    const response = await handler(postRequest("invalid-jwt"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(authenticateUser).toHaveBeenCalledOnce();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("lets a valid user JWT through the auth layer", async () => {
    const { authenticateUser, fetchImpl, handler } = createHandler();

    const response = await handler(postRequest("valid-user-jwt"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        name: "hello-world",
        description: "Example repository",
        url: "https://github.com/octocat/hello-world",
        stars: 7,
        language: "TypeScript",
        forks: 2,
      },
    ]);
    expect(authenticateUser).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer server-github-token",
    });
  });

  it("preserves the GitHub 404 response", async () => {
    const { fetchImpl, handler } = createHandler();
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Not Found" }), { status: 404 })
    );

    const response = await handler(postRequest("valid-user-jwt"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "GITHUB_USER_NOT_FOUND",
      message: "Пользователь GitHub не найден.",
    });
  });

  it("preserves GitHub rate-limit handling", async () => {
    const { fetchImpl, handler } = createHandler();
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "API rate limit exceeded" }), {
        status: 429,
      })
    );

    const response = await handler(postRequest("valid-user-jwt"));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "GITHUB_RATE_LIMIT",
      message: "Лимит запросов GitHub временно исчерпан. Попробуйте позже.",
    });
  });

  it("rejects an auth verification error before calling GitHub", async () => {
    const { authenticateUser, fetchImpl, handler } = createHandler();
    authenticateUser.mockRejectedValueOnce(new Error("expired token"));

    const response = await handler(postRequest("expired-jwt"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("wires user auth in the deployed entrypoint and disables gateway JWT verification", () => {
    const entrypoint = readFileSync(resolve(functionDirectory, "index.ts"), "utf8");
    const config = readFileSync(configPath, "utf8");

    expect(entrypoint).toContain("createSupabaseUserAuthenticator");
    expect(entrypoint).toContain("GITHUB_TOKEN_EXPIRES_AT");
    expect(entrypoint).not.toContain("Supabase project key selection");
    expect(entrypoint).not.toContain("createSupabaseContext");
    expect(entrypoint).not.toContain("@supabase/server");
    expect(config).toMatch(
      /\[functions\.github-repos\][\s\S]*?verify_jwt\s*=\s*false/
    );
  });
});
