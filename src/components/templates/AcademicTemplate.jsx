
import { Box, Typography, Paper, Grid, Divider, Chip } from "@mui/material";
import { getSkillName, getSkillLevel, getEducationYears, getWorkPeriod, buildProfileContactLinks } from "../../utils/helpers";
import ResumeAvatar from "./ResumeAvatar";

const SectionTitle = ({ children, color = "#2e7d32" }) => (
  <Box sx={{ mb: 2 }}>
    <Typography
      variant="h5"
      sx={{
        color,
        fontWeight: 800,
        fontFamily: '"Georgia", serif',
        fontSize: "1.3rem",
        mb: 1,
      }}
    >
      {children}
    </Typography>
    <Divider sx={{ borderColor: color }} />
  </Box>
);

export default function AcademicTemplate({ data }) {
  const { profile, skills, education, experience, github } = data || {};
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const meaningfulProjects = projects.filter((p) => p.name || p.description);
  const primary = "#2e7d32";

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
          position: "relative",
          px: profile?.photo ? "30mm" : 0,
          textAlign: "center",
          mb: 4,
          pb: 2.5,
          borderBottom: `3px solid ${primary}`,
        }}
      >
        <ResumeAvatar profile={profile} borderColor="#a5d6a7" />
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

        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", justifyContent: "center" }}>
          {buildProfileContactLinks(profile).map((link, idx, arr) => (
            <Box key={link.type} sx={{ display: "inline-flex", alignItems: "center" }}>
              {link.href ? (
                <Typography
                  variant="body2"
                  component="a"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "#2e7d32", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  {link.value}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {link.value}
                </Typography>
              )}
              {idx < arr.length - 1 && (
                <Typography variant="body2" sx={{ color: "#9ca3af", mx: 0.5 }}>•</Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={7}>
          {/* Education */}
          {education && education.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <SectionTitle>Образование</SectionTitle>

              {education.map((edu, idx) => {
                const year = getEducationYears(edu);

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
                          whiteSpace: "pre-line",
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

          {/* Manual Projects */}
          {meaningfulProjects.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <SectionTitle>Проекты</SectionTitle>
              {meaningfulProjects.map((proj) => (
                <Box key={proj.id} sx={{ mb: 2.5, pl: 2, borderLeft: `4px solid ${primary}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1.05rem", color: "#111827", mb: 0.5 }}>
                    {proj.name || "Проект"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: primary, fontWeight: 700, mb: 0.5 }}>
                    {[proj.role, proj.period].filter(Boolean).join(" | ")}
                  </Typography>
                  {proj.techStack && (
                    <Typography variant="body2" sx={{ color: "#6b7280", fontSize: "0.85rem", mb: 0.5 }}>
                      Стек: {proj.techStack}
                    </Typography>
                  )}
                  {proj.description && (
                    <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                      {proj.description}
                    </Typography>
                  )}
                  {proj.link && (
                    <Typography variant="body2" component="a" href={proj.link} target="_blank" rel="noopener noreferrer" sx={{ color: primary, fontSize: "0.85rem", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                      {proj.link.replace(/^https?:\/\//, "")}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* GitHub Projects */}
          {github && github.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <SectionTitle>GitHub проекты</SectionTitle>

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
