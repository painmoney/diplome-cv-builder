import { createClient } from "@supabase/supabase-js";

type GetEnvironmentVariable = (name: string) => string | undefined;

type SupabaseUserLookupClient = {
  auth: {
    getUser: (jwt: string) => Promise<{
      data: { user?: { id?: unknown } | null };
      error: unknown;
    }>;
  };
};

export function extractBearerJwt(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  return match?.[1] || null;
}

export function resolveSupabasePublicKey(getEnv: GetEnvironmentVariable) {
  const namedPublishableKeys = getEnv("SUPABASE_PUBLISHABLE_KEYS");
  let publishableKeysParsed = false;
  let publishableKeyNames: string[] = [];
  let selectedKey: string | null = null;
  let selectedKeySource: "publishable:default" | "legacy:anon" | "none" =
    "none";

  if (namedPublishableKeys?.trim()) {
    try {
      const parsed = JSON.parse(namedPublishableKeys);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        publishableKeysParsed = true;
        publishableKeyNames = Object.keys(parsed).sort();

        if (typeof parsed.default === "string" && parsed.default.trim()) {
          selectedKey = parsed.default.trim();
          selectedKeySource = "publishable:default";
        }
      }
    } catch {
      publishableKeysParsed = false;
    }
  }

  if (!selectedKey) {
    const anonKey = getEnv("SUPABASE_ANON_KEY")?.trim();
    if (anonKey) {
      selectedKey = anonKey;
      selectedKeySource = "legacy:anon";
    }
  }

  return {
    key: selectedKey,
    diagnostics: {
      hasPublishableKeysEnv: Boolean(namedPublishableKeys?.trim()),
      publishableKeysParsed,
      publishableKeyNames,
      selectedKeySource,
      selectedKeyLooksPublishable: Boolean(
        selectedKey?.startsWith("sb_publishable_")
      ),
      selectedKeyLooksLegacyJwt: Boolean(
        selectedKey &&
          /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(selectedKey)
      ),
    },
  };
}

export function createSupabaseAuthClient(
  supabaseUrl: string,
  publicKey: string
) {
  return createClient(supabaseUrl, publicKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createSupabaseUserAuthenticator(
  client: SupabaseUserLookupClient | null
) {
  return async (req: Request) => {
    const jwt = extractBearerJwt(req);
    if (!jwt || !client) return false;

    try {
      const { data, error } = await client.auth.getUser(jwt);
      const hasUser =
        typeof data.user?.id === "string" && data.user.id.length > 0;
      return !error && hasUser;
    } catch {
      return false;
    }
  };
}
