
import { Box, Typography, TextField } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import AvatarUpload from "./AvatarUpload";

export default function ProfileForm({ data = {}, errors = {}, onChange }) {
  const { user } = useAuth();

  // Приоритетное поле для "О себе": about, но поддерживаем summary (legacy)
  const aboutValue = data.about ?? data.summary ?? "";

  const handleChange = (field, value) => {
    const next = { ...data, [field]: value };

    // мост about <-> summary
    if (field === "about") next.summary = value;
    if (field === "summary") next.about = value;

    onChange(next);
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom>
        Личные данные
      </Typography>

      <AvatarUpload
        userId={user?.id}
        avatarUrl={data.photo || ""}
        displayName={data.name || ""}
        disabled={!user?.id}
        onAvatarChange={(url) => handleChange("photo", url)}
      />

      <TextField
        id="profile-name"
        label="ФИО"
        value={data.name || ""}
        onChange={(e) => handleChange("name", e.target.value)}
        fullWidth
        margin="normal"
        placeholder="Иван Иванов"
        error={Boolean(errors.name)}
        helperText={errors.name || " "}
      />

      <TextField
        id="profile-email"
        label="Email"
        value={data.email || ""}
        onChange={(e) => handleChange("email", e.target.value)}
        fullWidth
        margin="normal"
        placeholder="ivan.ivanov@example.com"
        error={Boolean(errors.email)}
        helperText={errors.email || " "}
      />

      <TextField
        id="profile-phone"
        label="Телефон"
        value={data.phone || ""}
        onChange={(e) => handleChange("phone", e.target.value)}
        fullWidth
        margin="normal"
        placeholder="+7 (900) 123-45-67"
        error={Boolean(errors.phone)}
        helperText={errors.phone || " "}
      />

      <TextField
        id="profile-about"
        label="О себе (краткое резюме)"
        value={aboutValue}
        onChange={(e) => handleChange("about", e.target.value)}
        fullWidth
        multiline
        rows={4}
        margin="normal"
        placeholder="Frontend/Fullstack разработчик... Стек... Достижения..."
        error={Boolean(errors.about)}
        helperText={errors.about || " "}
      />
    </Box>
  );
}