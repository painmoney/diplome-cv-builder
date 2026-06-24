/**
 * Browser env adapter.
 * Passes only explicit public values to the validator.
 * Never exposes import.meta.env globally.
 */
import { validatePublicEnv } from "./publicEnvSchema";

let _config;

try {
  _config = validatePublicEnv({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    MODE: import.meta.env.MODE,
  });
} catch (err) {
  if (import.meta.env.DEV) {
    console.error("[env]", err.message);
  }
  throw err;
}

export const envConfig = _config;
