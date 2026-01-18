import React, { useState, useEffect } from "react";
import { Container, Typography, Button, Avatar, TextField } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { uploadAvatar, getAvatarUrl, uploadResume } from "../../api/storage";

export default function ProfileForm() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    if (user) {
      const url = getAvatarUrl(user.id);
      setAvatarUrl(url);
    }
  }, [user]);

  // Загрузка аватара
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    try {
      await uploadAvatar(user.id, avatarFile);
      const url = getAvatarUrl(user.id);
      setAvatarUrl(url);
      alert("Аватар успешно загружен!");
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке аватара");
    }
  };

  // Загрузка резюме
  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    try {
      await uploadResume(user.id, Date.now(), resumeFile, "pdf");
      alert("Резюме успешно загружено!");
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке резюме");
    }
  };

  return (
    <Container sx={{ mt: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Профиль
      </Typography>

      {/* Аватар */}
      <Avatar
        src={avatarUrl}
        sx={{ width: 100, height: 100, margin: "0 auto 1rem" }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setAvatarFile(e.target.files[0])}
      />
      <Button variant="contained" sx={{ mt: 1 }} onClick={handleAvatarUpload}>
        Загрузить аватар
      </Button>

      <hr style={{ margin: "2rem 0" }} />

      {/* Резюме */}
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setResumeFile(e.target.files[0])}
      />
      <Button variant="contained" sx={{ mt: 1 }} onClick={handleResumeUpload}>
        Загрузить резюме
      </Button>
    </Container>
  );
}
