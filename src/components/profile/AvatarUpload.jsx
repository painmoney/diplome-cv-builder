import React, { useState, useEffect } from "react";
import { Box, Button, Avatar, Alert } from "@mui/material";
import { supabase } from "../../api/supabaseClient";

export default function AvatarUpload({ user }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
  }, [user.id]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `${user.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    setAvatarUrl(data.publicUrl);

    // Сохраняем ссылку в профиле
    await supabase.from("profiles").upsert({ id: user.id, avatar_url: data.publicUrl });
    setError(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <Avatar src={avatarUrl} sx={{ width: 120, height: 120 }} />
      <Button variant="contained" component="label">
        Загрузить аватар
        <input type="file" hidden accept="image/*" onChange={handleUpload} />
      </Button>
    </Box>
  );
}
