import {
  createSupabaseAuthClient,
  createSupabaseUserAuthenticator,
  resolveSupabasePublicKey,
} from "./supabaseAuth.ts";
import { createGitHubReposHandler } from "./handler.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const publicKeySelection = resolveSupabasePublicKey((name) =>
  Deno.env.get(name)
);
const authClient =
  supabaseUrl && publicKeySelection.key
    ? createSupabaseAuthClient(supabaseUrl, publicKeySelection.key)
    : null;

Deno.serve(
  createGitHubReposHandler({
    authenticateUser: createSupabaseUserAuthenticator(authClient),
    fetchImpl: fetch,
    getGitHubToken: () => Deno.env.get("GITHUB_TOKEN"),
    getGitHubTokenExpiresAt: () =>
      Deno.env.get("GITHUB_TOKEN_EXPIRES_AT"),
  })
);
