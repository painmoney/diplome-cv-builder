import { supabase } from "./supabaseClient";

const DEFAULT_RESUME_DATA = {
  profile: {
    name: "", photo: "", about: "", summary: "", email: "", phone: "",
    location: "", githubUrl: "", website: "", telegram: "", linkedin: "", habrCareer: "",
  },
  education: [],
  skills: [],
  experience: [],
  github: [],
  projects: [],
  template: "minimalist",
};

const normalizeProfile = (profile = {}) => {
  const about = profile.about ?? profile.summary ?? "";

  return {
    ...profile,
    about,
    summary: profile.summary ?? about,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    name: profile.name ?? "",
    photo: profile.photo ?? "",
    location: profile.location ?? "",
    githubUrl: profile.githubUrl ?? "",
    website: profile.website ?? "",
    telegram: profile.telegram ?? "",
    linkedin: profile.linkedin ?? "",
    habrCareer: profile.habrCareer ?? "",
  };
};

export const normalizeLoadedResumeData = (data = {}) => {
  const merged = {
    ...DEFAULT_RESUME_DATA,
    ...data,
    profile: normalizeProfile(data.profile || {}),
    education: Array.isArray(data.education) ? data.education : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    github: Array.isArray(data.github) ? data.github : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    template: data.template || "minimalist",
  };

  return merged;
};

const cleanText = (value) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
};

// ── RPC wrappers ─────────────────────────────────────────

/**
 * Normalize RPC TABLE result into a plain object.
 * supabase.rpc() with RETURNS TABLE returns an array.
 */
function parseRpcResult(data) {
  if (!data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    resumeId: row.out_resume_id,
    revision: row.out_revision,
    updatedAt: row.out_updated_at,
  };
}

/**
 * Create a new resume via atomic RPC.
 * Idempotent: same UUID + same user → returns existing metadata.
 * @returns {{ resumeId: string, revision: number, updatedAt: string }}
 */
export async function createResumeFullRpc({ resumeId, title, template, data }) {
  const { data: result, error } = await supabase.rpc("create_resume_full", {
    p_resume_id: resumeId,
    p_title: title,
    p_template: template,
    p_data: data,
  });

  if (error) throw error;
  return parseRpcResult(result);
}

/**
 * Update an existing resume via atomic RPC with revision check.
 * @returns {{ resumeId: string, revision: number, updatedAt: string }}
 */
export async function saveResumeFullRpc({ resumeId, title, template, data, expectedRevision }) {
  const { data: result, error } = await supabase.rpc("save_resume_full", {
    p_resume_id: resumeId,
    p_title: title,
    p_template: template,
    p_data: data,
    p_expected_revision: expectedRevision,
  });

  if (error) throw error;
  return parseRpcResult(result);
}

/**
 * Save account-level profile (separate from resume RPC).
 */
export async function saveProfile(userId, profile = {}) {
  const payload = {
    user_id: userId,
    full_name: cleanText(profile.name),
    avatar_url: cleanText(profile.photo),
    email: cleanText(profile.email),
    phone: cleanText(profile.phone),
    about: cleanText(profile.about ?? profile.summary),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw error;
}

// ── Load ─────────────────────────────────────────────────

/**
 * Load existing resume. Returns null if user has no resume.
 */
export async function loadUserResume(userId) {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  return {
    ...data,
    data: normalizeLoadedResumeData(data.data || {}),
  };
}
