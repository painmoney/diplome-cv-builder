import React from "react";
import { Box, Typography, Paper, Grid, Divider, Chip } from "@mui/material";

export default function AcademicTemplate({ data }) {
  const { profile, skills, education, experience, github } = data || {};
  const primary = "#2e7d32";

  const getSkillName = (skill) => {
    if (typeof skill === "string") return skill;
    if (skill && typeof skill === "object") return skill.name || "";
    return "";
  };

  const getSkillLevel = (skill) => {
    if (skill && typeof skill === "object" && skill.level) return skill.level;
    return "";
  };

  const getEducationYear = (edu) => {
    if (edu.years) return edu.years;
    if (edu.year) return edu.year;
    if (edu.graduationYear) return edu.graduationYear;
    if (edu.period) return edu.period;
    if (edu.startYear && edu.endYear) return `${edu.startYear}–${edu.endYear}`;
    return "";
  };

  const getWorkPeriod = (exp) => {
    if (exp.period) return exp.period;

    const start = exp.startDate || exp.start || exp.from || "";
    const end = exp.endDate || exp.end || exp.to || "";

    if (start && end) return `${start} – ${end}`;
    if (start && exp.current) return `${start} – настоящее время`;
    if (start) return start;
    if (end) return end;

    return "";
  };

  const SectionTitle = ({ children }) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="h5"
        sx={{
          color: primary,
          fontWeight: 800,
          fontFamily: '"Georgia", serif',
          fontSize: "1.3rem",
          mb: 1,
        }}
      >
        {children}
      </Typography>
      <Divider sx={{ borderColor: primary }} />
    </Box>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "18mm",
        backgroundColor: "#ffffff",
        color: "#1f2933",
        boxSizing: "border-box",
        fontFamily: '"Roboto", "Arial", sans-serif',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          textAlign: "center",
          mb: 4,
          pb: 2.5,
          borderBottom: `3px solid ${primary}`,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            color: primary,
            fontWeight: 900,
            fontFamily: '"Georgia", serif',
            fontSize: "2rem",
            mb: 1,
          }}
        >
          {profile?.name || "Имя не указано"}
        </Typography>

        {profile?.about && (
          <Typography
            variant="body1"
            sx={{
              color: "#4b5563",
              lineHeight: 1.7,
              maxWidth: "90%",
              margin: "0 auto",
              mb: 1.5,
            }}
          >
            {profile.about}
          </Typography>
        )}

        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          {[profile?.email, profile?.phone].filter(Boolean).join(" | ")}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={7}>
          {/* Education */}
          {education && education.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <SectionTitle>Образование</SectionTitle>

              {education.map((edu, idx) => {
                const year = getEducationYear(edu);

                return (
                  <Box
                    key={idx}
                    sx={{
                      mb: 2.5,
                      pl: 2,
                      borderLeft: `4px solid ${primary}`,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        fontSize: "1.05rem",
                        color: "#111827",
                        mb: 0.5,
                      }}
                    >
                      {edu.institution || "Учебное заведение"}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: primary,
                        fontWeight: 700,
                        mb: 0.75,
                      }}
                    >
                      {[edu.degree, year].filter(Boolean).join(" | ")}
                    </Typography>

                    {edu.institute && (
                      <Typography variant="body2" sx={{ color: "#374151", mb: 0.35 }}>
                        <b>Институт:</b> {edu.institute}
                      </Typography>
                    )}

                    {edu.department && (
                      <Typography variant="body2" sx={{ color: "#374151", mb: 0.35 }}>
                        <b>Кафедра:</b> {edu.department}
                      </Typography>
                    )}

                    {edu.program && (
                      <Typography variant="body2" sx={{ color: "#374151" }}>
                        <b>Направление подготовки/специальности:</b> {edu.program}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <SectionTitle>Опыт работы</SectionTitle>

              {experience.map((exp, idx) => {
                const period = getWorkPeriod(exp);

                return (
                  <Box key={idx} sx={{ mb: 2.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        fontSize: "1.05rem",
                        color: "#111827",
                      }}
                    >
                      {exp.position || "Должность"}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: primary,
                        fontWeight: 700,
                        mb: 0.5,
                      }}
                    >
                      {exp.company || "Компания"}
                    </Typography>

                    {period && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                          fontStyle: "italic",
                          mb: 0.75,
                        }}
                      >
                        {period}
                      </Typography>
                    )}

                    {exp.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#374151",
                          lineHeight: 1.7,
                          textAlign: "justify",
                        }}
                      >
                        {exp.description}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={5}>
          {/* Skills */}
          {skills && skills.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <SectionTitle>Навыки</SectionTitle>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {skills.map((skill, idx) => {
                  const name = getSkillName(skill);
                  const level = getSkillLevel(skill);

                  return (
                    <Box
                      key={idx}
                      sx={{
                        bgcolor: "#f1f8e9",
                        p: 1,
                        borderLeft: `4px solid ${primary}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {level ? `${name} — ${level}/5` : name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* GitHub Projects */}
          {github && github.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <SectionTitle>Проекты</SectionTitle>

              {github.map((repo, idx) => (
                <Box
                  key={idx}
                  sx={{
                    mb: 2,
                    p: 1.5,
                    bgcolor: "#f9fafb",
                    borderRadius: 1,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 900, color: "#111827" }}
                  >
                    {repo.name || "Репозиторий"}
                  </Typography>

                  {repo.description && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: "#4b5563",
                        lineHeight: 1.5,
                        mt: 0.5,
                      }}
                    >
                      {repo.description}
                    </Typography>
                  )}

                  <Box sx={{ mt: 0.75 }}>
                    <Chip
                      label={`⭐ ${repo.stars || 0}`}
                      size="small"
                      sx={{
                        bgcolor: "#e8f5e9",
                        color: primary,
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}