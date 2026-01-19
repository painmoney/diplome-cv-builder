import React from "react";
import { Box, Typography, Chip, Paper } from "@mui/material";

export default function MinimalistTemplate({ data }) {
  const { profile, skills, education, experience, github } = data || {};

  // ---------- helpers ----------
  const safe = (v) => (typeof v === "string" ? v.trim() : v ?? "");
  const getSkillName = (skill) => {
    if (typeof skill === "string") return skill;
    if (skill && typeof skill === "object") return skill.name || "";
    return "";
  };

  const getEducationYear = (edu = {}) => {
    if (safe(edu.years)) return edu.years; // ✅ новые данные
    if (safe(edu.year)) return edu.year;
    if (safe(edu.startYear) && safe(edu.endYear)) return `${edu.startYear}-${edu.endYear}`;
    if (safe(edu.startYear)) return edu.startYear;
    return "";
  };

  const getWorkPeriod = (exp = {}) => {
    if (safe(exp.period)) return exp.period; // ✅ новые данные
    const start = safe(exp.startDate);
    const end = safe(exp.endDate) || (exp.current ? "Настоящее время" : "");
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    if (end) return end;
    return "";
  };

  const Hr = ({ mb = 2 }) => (
    <Box
      sx={{
        width: "100%",
        height: "1px",
        bgcolor: "#d0d7de",
        mb,
      }}
    />
  );

  // ---------- styles ----------
  const primary = "#1976d2";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "20mm",
        backgroundColor: "white",
        color: "#111", // ✅ фикс для dark mode
        boxSizing: "border-box",
        border: "1px solid #eaeaea",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4, pb: 2, borderBottom: `3px solid ${primary}` }}>
        <Typography
          variant="h3"
          sx={{
            color: primary,
            fontWeight: 800,
            mb: 1.5,
            fontSize: "2rem",
            lineHeight: 1.1,
          }}
        >
          {profile?.name || "Имя не указано"}
        </Typography>

        {profile?.about && (
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6, color: "#222" }}>
            {profile.about}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, color: "#555" }}>
          {profile?.email && (
            <Typography variant="body2">
              <strong>Email:</strong> {profile.email}
            </Typography>
          )}
          {profile?.phone && (
            <Typography variant="body2">
              <strong>Телефон:</strong> {profile.phone}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              color: primary,
              fontWeight: 800,
              mb: 1,
              fontSize: "1.25rem",
            }}
          >
            Навыки
          </Typography>
          <Hr />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {skills.map((skill, idx) => (
              <Chip
                key={idx}
                label={getSkillName(skill)}
                size="medium"
                sx={{
                  bgcolor: "#dbeafe",
                  color: "#0f172a",
                  border: "1px solid #bfdbfe",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              color: primary,
              fontWeight: 800,
              mb: 1,
              fontSize: "1.25rem",
            }}
          >
            Опыт работы
          </Typography>
          <Hr />
          {experience.map((exp, idx) => {
            const period = getWorkPeriod(exp);
            return (
              <Box key={idx} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: "#111" }}>
                  {exp.position || "Должность"}
                </Typography>

                <Typography variant="body2" sx={{ color: "#555", mb: 1 }}>
                  {exp.company || "Компания"}
                  {period ? ` | ${period}` : ""}
                </Typography>

                {exp.description && (
                  <Typography variant="body2" sx={{ lineHeight: 1.7, color: "#222" }}>
                    {exp.description}
                  </Typography>
                )}

                {idx !== experience.length - 1 && (
                  <Box sx={{ mt: 2, width: "100%", height: "1px", bgcolor: "#eef2f6" }} />
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              color: primary,
              fontWeight: 800,
              mb: 1,
              fontSize: "1.25rem",
            }}
          >
            Образование
          </Typography>
          <Hr />
          {education.map((edu, idx) => {
            const year = getEducationYear(edu);
            return (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: "#111" }}>
                  {edu.degree || "Степень"}
                </Typography>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {edu.institution || "Учебное заведение"}
                  {year ? ` | ${year}` : ""}
                </Typography>

                {idx !== education.length - 1 && (
                  <Box sx={{ mt: 2, width: "100%", height: "1px", bgcolor: "#eef2f6" }} />
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* GitHub Projects */}
      {github && github.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              color: primary,
              fontWeight: 800,
              mb: 1,
              fontSize: "1.25rem",
            }}
          >
            GitHub проекты
          </Typography>
          <Hr />

          {github.map((repo, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: "#111" }}>
                {repo.name}
              </Typography>

              {repo.description && (
                <Typography variant="body2" sx={{ mb: 0.5, lineHeight: 1.6, color: "#222" }}>
                  {repo.description}
                </Typography>
              )}

              <Typography variant="body2" sx={{ color: "#555" }}>
                ⭐ {repo.stars || 0} stars
              </Typography>

              {idx !== github.length - 1 && (
                <Box sx={{ mt: 2, width: "100%", height: "1px", bgcolor: "#eef2f6" }} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
