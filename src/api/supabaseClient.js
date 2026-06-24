import { createClient } from "@supabase/supabase-js";
import { envConfig } from "../config/env";

export const supabase = createClient(envConfig.supabaseUrl, envConfig.supabaseClientKey);

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return { data, error };
}