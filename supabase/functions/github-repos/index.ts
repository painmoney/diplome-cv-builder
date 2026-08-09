import { createSupabaseContext } from "@supabase/server";
import { createGitHubReposHandler } from "./handler.ts";

const authenticateUser = async (req: Request) => {
  const { data: context, error } = await createSupabaseContext(req, {
    auth: "user",
  });

  return !error && context?.authMode === "user" && Boolean(context.userClaims);
};

Deno.serve(
  createGitHubReposHandler({
    authenticateUser,
    fetchImpl: fetch,
    getGitHubToken: () => Deno.env.get("GITHUB_TOKEN"),
  })
);
