
import { Box, Typography, Chip, Paper, Divider } from "@mui/material";
import { getSkillName, getSkillLevel, getEducationYears, getWorkPeriod, buildProfileContactLinks } from "../../utils/helpers";

const SectionTitle = ({ children, color = "#1976d2" }) => (
  <Box sx={{ mb: 2 }}>
    <Typography
      variant="h5"
      sx={{
        color,
        fontWeight: 800,
        fontSize: "1.3rem",
        mb: 1,
      }}
    >
      {children}
    </Typography>
    <Divider sx={{ borderColor: "#d7e3f5" }} />
  </Box>
);

const LightChip = ({ label }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      bgcolor: "#f8fafc",
      color: "#111827",
      border: "1px solid #cbd5e1",
      fontWeight: 500,
    }}
  />
);

export default function MinimalistTemplate({ data }) {
  const { profile, skills, education, experience, github } = data || {};
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const meaningfulProjects = projects.filter((p) => p.name || p.description);
  const primary = "#1976d2";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "20mm",
        backgroundColor: "#ffffff",
        color: "#111827",
        boxSizing: "border-box",
        fontFamily: '"Roboto", "Arial", sans-serif',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          pb: 2,
          borderBottom: `3px solid ${primary}`,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            color: primary,
            fontWeight: 900,
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
              color: "#374151",
              lineHeight: 1.7,
              mb: 1.5,
              textAlign: "justify",
            }}
          >
            {profile.about}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
          {buildProfileContactLinks(profile).map((link, idx, arr) => (
            <Box key={link.type} sx={{ display: "inline-flex", alignItems: "center" }}>
              {link.href ? (
                <Typography
                  variant="body2"
                  component="a"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "#1976d2", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  {link.value}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: "#374151" }}>
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

      {/* Skills */}
      {skills && skills.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle>Навыки</SectionTitle>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {skills.map((skill, idx) => {
              const name = getSkillName(skill);
              const level = getSkillLevel(skill);

              return (
                <Chip
                  key={idx}
                  label={level ? `${name} — ${level}/5` : name}
                  sx={{
                    bgcolor: "#e3f2fd",
                    color: "#0d47a1",
                    border: "1px solid #bbdefb",
                    fontWeight: 700,
                  }}
                />
              );
            })}
          </Box>
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
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    color: "#111827",
                  }}
                >
                  {exp.position || "Должность"}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "#4b5563",
                    fontWeight: 600,
                    mb: 0.75,
                  }}
                >
                  {[exp.company, period].filter(Boolean).join(" | ")}
                </Typography>

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

                {idx !== experience.length - 1 && (
                  <Divider sx={{ mt: 2, borderColor: "#eef2f7" }} />
                )}
              </Box>
            );
          })}
        </Box>
      )}

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
                  p: 2,
                  border: "1px solid #e5e7eb",
                  borderRadius: 2,
                  bgcolor: "#fafafa",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 900,
                    fontSize: "1.05rem",
                    color: "#111827",
                    mb: 0.75,
                  }}
                >
                  {edu.institution || "Учебное заведение"}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                  {edu.degree && (
                    <Chip
                      label={edu.degree}
                      size="small"
                      sx={{
                        bgcolor: "#e3f2fd",
                        color: "#0d47a1",
                        border: "1px solid #bbdefb",
                        fontWeight: 700,
                      }}
                    />
                  )}

                  {year && <LightChip label={year} />}
                </Box>

                {edu.institute && (
                  <Typography
                    variant="body2"
                    sx={{ color: "#374151", mb: 0.4 }}
                  >
                    <b>Институт:</b> {edu.institute}
                  </Typography>
                )}

                {edu.department && (
                  <Typography
                    variant="body2"
                    sx={{ color: "#374151", mb: 0.4 }}
                  >
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

      {/* Manual Projects */}
      {meaningfulProjects.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle>Проекты</SectionTitle>
          {meaningfulProjects.map((proj) => (
            <Box key={proj.id} sx={{ mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#111827" }}>
                {proj.name || "Проект"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#4b5563", fontWeight: 600, mb: 0.75 }}>
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
                <Typography variant="body2" component="a" href={proj.link} target="_blank" rel="noopener noreferrer" sx={{ color: "#1976d2", fontSize: "0.85rem", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                  {proj.link.replace(/^https?:\/\//, "")}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* GitHub Projects */}
      {github && github.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <SectionTitle>GitHub проекты</SectionTitle>

          {github.map((repo, idx) => (
            <Box key={idx} sx={{ mb: 2.5 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  color: "#111827",
                  mb: 0.5,
                }}
              >
                {repo.name || "Репозиторий"}
              </Typography>

              {repo.description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "#374151",
                    lineHeight: 1.6,
                    mb: 0.5,
                  }}
                >
                  {repo.description}
                </Typography>
              )}

              <Typography variant="body2" sx={{ color: "#4b5563" }}>
                ⭐ {repo.stars || 0} stars
                {repo.url ? ` | ${repo.url}` : ""}
              </Typography>

              {idx !== github.length - 1 && (
                <Divider sx={{ mt: 2, borderColor: "#eef2f7" }} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}