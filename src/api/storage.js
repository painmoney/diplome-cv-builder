import { supabase } from "./supabaseClient";

/**
 * AVATAR FUNCTIONS
 */

// Загрузка аватара пользователя
export async function uploadAvatar(userId, file) {
  const filePath = `${userId}/avatar.png`;
  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (error) throw error;
  return data;
}

// Получение публичной ссылки на аватар
export function getAvatarUrl(userId) {
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(`${userId}/avatar.png`);
  return data.publicUrl;
}

// Удаление аватара
export async function deleteAvatar(userId) {
  const { data, error } = await supabase.storage
    .from("avatars")
    .remove([`${userId}/avatar.png`]);

  if (error) throw error;
  return data;
}

/**
 * RESUME FUNCTIONS
 */

// Загрузка резюме (pdf, md, docx)
export async function uploadResume(userId, resumeId, file, ext = "pdf") {
  const filePath = `${userId}/resume_${resumeId}.${ext}`;
  const { data, error } = await supabase.storage
    .from("resumes")
    .upload(filePath, file, { upsert: true });

  if (error) throw error;
  return data;
}

// Получение signed URL для скачивания резюме
export async function getResumeSignedUrl(userId, resumeId, ext = "pdf", expiresIn = 60) {
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(`${userId}/resume_${resumeId}.${ext}`, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

// Удаление резюме
export async function deleteResume(userId, resumeId, ext = "pdf") {
  const { data, error } = await supabase.storage
    .from("resumes")
    .remove([`${userId}/resume_${resumeId}.${ext}`]);

  if (error) throw error;
  return data;
}
