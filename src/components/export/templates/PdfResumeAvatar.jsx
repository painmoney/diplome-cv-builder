import { Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  avatar: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 64,
    height: 64,
    objectFit: "cover",
    objectPosition: "center",
    borderRadius: 32,
    borderWidth: 2,
    backgroundColor: "#ffffff",
  },
});

export default function PdfResumeAvatar({
  profile,
  borderColor = "#d1d5db",
  style,
}) {
  const photo = String(profile?.photo || "").trim();
  if (!photo) return null;
  const borderRadius = profile?.avatarShape === "square" ? 4 : 32;

  return (
    <Image
      src={photo}
      style={[styles.avatar, { borderColor, borderRadius }, style]}
    />
  );
}
