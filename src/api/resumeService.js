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

// ── Internal helpers ─────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

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
 * Map a resumes table row to a summary object (excludes data blob).
 */
function mapResumeSummary(row) {
  return {
    resumeId: row.id,
    title: row.title,
    template: row.template,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map a resumes table row to a full loaded resume.
 */
function mapLoadedResume(row) {
  return {
    resumeId: row.id,
    userId: row.user_id,
    title: row.title,
    template: row.template,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    data: normalizeLoadedResumeData(row.data || {}),
  };
}

/**
 * Create a standardized not-found/forbidden error.
 */
function createNotFoundError() {
  const err = new Error("RESUME_NOT_FOUND_OR_FORBIDDEN");
  err.code = "P1004";
  return err;
}

function mapAccountProfile(row) {
  if (!row) return null;
  return normalizeProfile({
    name: row.full_name || "",
    photo: row.avatar_url || "",
    email: row.email || "",
    phone: row.phone || "",
    about: row.about || "",
    summary: row.about || "",
  });
}

async function loadAccountProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email, phone, about")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;
  return mapAccountProfile(data);
}

// ── RPC wrappers ─────────────────────────────────────────

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

// ── Multi-resume service functions ───────────────────────

/**
 * Create a new empty resume with defaults.
 * @param {Object} [options]
 * @param {string} [options.userId] Used to prefill profile from account-level profile.
 * @param {string} [options.title]
 * @param {string} [options.template]
 * @param {Object} [options.data]
 * @returns {Promise<Object>} Create RPC metadata.
 */
export async function createNewResume(options = {}) {
  const accountProfile = await loadAccountProfile(options.userId);
  const defaultData = normalizeLoadedResumeData({
    ...(options.data || {}),
    profile: {
      ...(accountProfile || {}),
      ...(options.data?.profile || {}),
    },
  });
  const result = await createResumeFullRpc({
    resumeId: crypto.randomUUID(),
    title: options.title || "Новое резюме",
    template: options.template || defaultData.template || "minimalist",
    data: defaultData,
  });
  return result;
}

/**
 * List all resumes for a user (summary only, no data blob).
 * @param {string} userId
 * @returns {Promise<Array>} Array of resume summary objects.
 */
export async function listUserResumes(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, template, revision, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true });

  if (error) throw error;

  return (data || []).map(mapResumeSummary);
}

/**
 * Load a single resume by its ID.
 * RLS hides foreign resumes → returns null for both nonexistent and foreign.
 * Returns null for invalid UUID without hitting the database.
 * @param {string} resumeId
 * @returns {Promise<Object|null>} Full loaded resume or null.
 */
export async function loadResumeById(resumeId) {
  if (!isValidUuid(resumeId)) return null;

  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  return mapLoadedResume(data);
}

/**
 * Rename a resume by loading it and re-saving with new title.
 * Uses revision control via saveResumeFullRpc.
 * @param {string} resumeId
 * @param {string} newTitle
 * @returns {Promise<Object>} Save RPC metadata.
 */
export async function renameResumeById(resumeId, newTitle) {
  const source = await loadResumeById(resumeId);
  if (!source) throw createNotFoundError();

  return saveResumeFullRpc({
    resumeId: source.resumeId,
    title: cleanText(newTitle) || "Untitled",
    template: source.data.template,
    data: source.data,
    expectedRevision: source.revision,
  });
}

/**
 * Duplicate a resume by loading source and creating a new one.
 * @param {string} sourceResumeId
 * @param {Object} [options]
 * @param {string} [options.title] Override default "<title> (копия)" title.
 * @returns {Promise<Object>} Create RPC metadata.
 */
export async function duplicateResumeById(sourceResumeId, options = {}) {
  const source = await loadResumeById(sourceResumeId);
  if (!source) throw createNotFoundError();

  const newId = crypto.randomUUID();
  const title = options.title || `${source.title || "Untitled"} (копия)`;

  return createResumeFullRpc({
    resumeId: newId,
    title,
    template: source.data.template,
    data: source.data,
  });
}

/**
 * Delete a resume by ID via RLS.
 * FK CASCADE handles child table cleanup.
 * @param {string} resumeId
 * @returns {Promise<string>} The deleted resumeId.
 */
export async function deleteResumeById(resumeId) {
  const { data, error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)
    .select("id")
    .maybeSingle();

  if (error) throw error;

  if (!data) throw createNotFoundError();

  return data.id;
}
