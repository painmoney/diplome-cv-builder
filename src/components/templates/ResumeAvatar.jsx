import { Box } from "@mui/material";

export default function ResumeAvatar({
  profile,
  size = "24mm",
  borderColor = "rgba(15, 23, 42, 0.16)",
  sx,
}) {
  const photo = String(profile?.photo || "").trim();
  if (!photo) return null;
  const isSquare = profile?.avatarShape === "square";

  return (
    <Box
      component="img"
      src={photo}
      alt={profile?.name ? `Фото ${profile.name}` : "Фото пользователя"}
      crossOrigin="anonymous"
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        width: size,
        height: size,
        display: "block",
        objectFit: "cover",
        objectPosition: "center",
        borderRadius: isSquare ? "2mm" : "50%",
        border: "2px solid",
        borderColor,
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
        ...sx,
      }}
    />
  );
}
