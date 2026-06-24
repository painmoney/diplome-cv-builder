/**
 * Pure public environment validator.
 * No browser APIs, no imports beyond builtins.
 *
 * Validates ONLY variables that ship to the browser bundle.
 * Never log or throw raw env values.
 */

const HTTPS_ONLY = /^https:\/\/.+/;

const SECRET_PREFIXES = ["sb_secret_", "sk-"];

function isSupabaseServiceRoleLike(value) {
  if (typeof value !== "string") return false;
  for (const prefix of SECRET_PREFIXES) {
    if (value.startsWith(prefix)) return true;
  }
  if (value.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(atob(value.split(".")[1]));
      if (payload && payload.role === "service_role") return true;
    } catch { /* not a JWT or invalid base64 — not a problem */ }
  }
  return false;
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {{ supabaseUrl: string, supabaseClientKey: string, mode: string }}
 */
export function validatePublicEnv(raw) {
  const errors = [];

  // ── VITE_SUPABASE_URL ──
  const url = raw.VITE_SUPABASE_URL;
  if (!url || typeof url !== "string" || url.trim() === "") {
    errors.push("VITE_SUPABASE_URL is required");
  } else {
    const trimmed = url.trim();
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/.test(trimmed);
    if (!isLocal && !HTTPS_ONLY.test(trimmed)) {
      errors.push("VITE_SUPABASE_URL must use https:// for remote deployments");
    }
  }

  // ── VITE_SUPABASE_ANON_KEY ──
  const key = raw.VITE_SUPABASE_ANON_KEY;
  if (!key || typeof key !== "string" || key.trim() === "") {
    errors.push("VITE_SUPABASE_ANON_KEY is required");
  } else if (isSupabaseServiceRoleLike(key.trim())) {
    errors.push("VITE_SUPABASE_ANON_KEY must not be a service-role or secret key");
  }

  if (errors.length > 0) {
    const msg = "Environment configuration error: " + errors.join("; ");
    throw new Error(msg);
  }

  return Object.freeze({
    supabaseUrl: url.trim(),
    supabaseClientKey: key.trim(),
    mode: String(raw.MODE || "production"),
  });
}
