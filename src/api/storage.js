import { supabase } from "./supabaseClient";

/**
 * AVATAR FUNCTIONS
 */

// Загрузка аватара пользователя
export async function uploadAvatar(userId, file) {
  const filePath = `${userId}/avatar.webp`;

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || "image/webp",
    });

  if (error) throw error;
  return data;
}

// Получение публичной ссылки на аватар
export function getAvatarUrl(userId) {
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(`${userId}/avatar.webp`);

  return data.publicUrl;
}

