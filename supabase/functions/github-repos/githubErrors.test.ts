import { afterEach, describe, expect, it, vi } from "vitest";
import { createGitHubReposHandler } from "./handler.ts";

const userJwt = "test-user-jwt";
const githubToken = "test-server-github-token";

function postRequest(token = userJwt) {
  return new Request("http://localhost/github-repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: "octocat" }),
  });
}

function successResponse() {
  return new Response(
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
    { status: 200 }
  );
}

function setup({
  token = githubToken,
  expiresAt,
  authenticated = true,
}: {
  token?: string;
  expiresAt?: string;
  authenticated?: boolean;
} = {}) {
  const fetchImpl = vi.fn().mockResolvedValue(successResponse());
  const authenticateUser = vi.fn().mockResolvedValue(authenticated);
  const handler = createGitHubReposHandler({
    authenticateUser,
    fetchImpl,
    getGitHubToken: () => token,
    getGitHubTokenExpiresAt: () => expiresAt,
    now: () => new Date("2026-08-09T12:00:00Z"),
  });

  return { authenticateUser, fetchImpl, handler };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("github-repos server token state", () => {
  it("returns GITHUB_TOKEN_NOT_CONFIGURED when the token is absent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { fetchImpl, handler } = setup({ token: "" });

    const response = await handler(postRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "GITHUB_TOKEN_NOT_CONFIGURED",
      message:
        "Интеграция GitHub временно недоступна: серверный токен не настроен.",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns GITHUB_TOKEN_EXPIRED without calling GitHub", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { fetchImpl, handler } = setup({
      expiresAt: "2026-08-09T11:59:59Z",
    });

    const response = await handler(postRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "GITHUB_TOKEN_EXPIRED",
      message:
        "Интеграция с GitHub временно недоступна. Серверный токен истёк.",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("calls GitHub when expiration is in the future", async () => {
    const { fetchImpl, handler } = setup({
      expiresAt: "2027-08-09T00:00:00Z",
    });

    const response = await handler(postRequest());

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it.each(["09.08.2027", "2027-02-31T00:00:00Z"])(
    "does not falsely expire malformed value %s",
    async (expiresAt) => {
      const warning = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const { fetchImpl, handler } = setup({ expiresAt });

      const response = await handler(postRequest());

      expect(response.status).toBe(200);
      expect(fetchImpl).toHaveBeenCalledOnce();
      expect(warning).toHaveBeenCalledWith(
        "[github-repos] Invalid GITHUB_TOKEN_EXPIRES_AT; expiration precheck skipped"
      );
    }
  );
});

describe("github-repos upstream errors", () => {
  it("normalizes GitHub 401 without claiming a known expiration", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { fetchImpl, handler } = setup();
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Bad credentials" }), {
        status: 401,
      })
    );

    const response = await handler(postRequest());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "GITHUB_TOKEN_INVALID",
      message:
        "GitHub отклонил серверный токен. Он мог истечь, быть отозван или стать недействительным.",
    });
    expect(body.error).not.toBe("GITHUB_TOKEN_EXPIRED");
    expect(JSON.stringify(body)).not.toContain("Bad credentials");
    expect(log).toHaveBeenCalledWith("[github-repos] GitHub token rejected", {
      status: 401,
      reason: "github_token_rejected",
      expirationConfigured: false,
      expirationPassed: false,
    });
  });

  it.each([
    {
      status: 403,
      headers: {
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "1786276860",
      },
      message: "Forbidden",
    },
    {
      status: 429,
      headers: { "Retry-After": "60" },
      message: "You have exceeded a secondary rate limit",
    },
  ])("normalizes GitHub $status rate limiting", async ({
    status,
    headers,
    message,
  }) => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { fetchImpl, handler } = setup();
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify({ message }), { status, headers })
    );

    const response = await handler(postRequest());

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "GITHUB_RATE_LIMIT",
      message: "Лимит запросов GitHub временно исчерпан. Попробуйте позже.",
    });
  });

  it("does not expose credentials or the raw GitHub payload in logs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { fetchImpl, handler } = setup();
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Bad credentials" }), {
        status: 401,
      })
    );

    await handler(postRequest());

    const serializedLogs = JSON.stringify(log.mock.calls);
    expect(serializedLogs).not.toContain(githubToken);
    expect(serializedLogs).not.toContain(userJwt);
    expect(serializedLogs).not.toContain("Bad credentials");
  });

  it("still blocks GitHub when Supabase authentication fails", async () => {
    const { fetchImpl, handler } = setup({ authenticated: false });

    const response = await handler(postRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
