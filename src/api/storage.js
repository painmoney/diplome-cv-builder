import { supabase } from "./supabaseClient";

/**
 * AVATAR FUNCTIONS
 */

// Загрузка аватара пользователя
export async function uploadAvatar(userId, file) {
  const filePath = `${userId}/avatar-${Date.now()}.webp`;

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || "image/webp",
      cacheControl: "31536000",
    });

  if (error) throw error;
  return data;
}

// Получение публичной ссылки на аватар
export function getAvatarUrl(userId, fileName = "avatar.webp") {
  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(`${userId}/${fileName}`);

  return data.publicUrl;
}

