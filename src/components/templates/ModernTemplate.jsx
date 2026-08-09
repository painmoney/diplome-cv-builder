
import { Box, Typography, Chip, Paper } from "@mui/material";
import { getSkillName, getSkillLevel, getEducationYears, getWorkPeriod, buildProfileContactLinks } from "../../utils/helpers";
import ResumeAvatar from "./ResumeAvatar";

const SectionTitle = ({ children }) => (
  <Typography
    variant="h6"
    sx={{
      fontWeight: 700,
      fontSize: "0.85rem",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#64748b",
      mb: 1.5,
    }}
  >
    {children}
  </Typography>
);

export default function ModernTemplate({ data }) {
  const { profile, skills, education, experience, github } = data || {};
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const meaningfulProjects = projects.filter((p) => p.name || p.description);
  const primary = "#0ea5e9";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: 0,
        backgroundColor: "#ffffff",
        color: "#0f172a",
        boxSizing: "border-box",
        fontFamily: '"Roboto", "Arial", sans-serif',
        overflow: "hidden",
      }}
    >
      {/* Accent header band */}
      <Box
        sx={{
          position: "relative",
          bgcolor: primary,
          pl: "20mm",
          pr: profile?.photo ? "50mm" : "20mm",
          pt: "15mm",
          pb: "12mm",
        }}
      >
        <ResumeAvatar
          profile={profile}
          size="22mm"
          borderColor="rgba(255, 255, 255, 0.72)"
          sx={{ top: "12mm", right: "20mm" }}
        />
        <Typography
          variant="h3"
          sx={{
            color: "#ffffff",
            fontWeight: 900,
            fontSize: "1.8rem",
            mb: 0.75,
          }}
        >
          {profile?.name || "Имя не указано"}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
          {buildProfileContactLinks(profile).map((link, idx, arr) => (
            <Box key={link.type} sx={{ display: "inline-flex", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#e0f2fe", fontSize: "0.8rem" }}>
                {link.value}
              </Typography>
              {idx < arr.length - 1 && (
                <Typography variant="body2" sx={{ color: "#bae6fd", mx: 0.5 }}>•</Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ px: "20mm", py: "8mm" }}>
        {/* About */}
        {profile?.about && (
          <Box sx={{ mb: 3 }}>
            <SectionTitle>О себе</SectionTitle>
            <Typography variant="body2" sx={{ fontSize: "9pt", color: "#475569", lineHeight: 1.6 }}>
              {profile.about}
            </Typography>
          </Box>
        )}

        {/* Tech Stack */}
        {skills && skills.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SectionTitle>Технологический стек</SectionTitle>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.75,
                p: 1.5,
                bgcolor: "#f0f9ff",
                borderRadius: 1,
                border: "1px solid #e0f2fe",
              }}
            >
              {skills.map((skill, idx) => {
                const name = getSkillName(skill);
                const level = getSkillLevel(skill);
                return (
                  <Chip
                    key={idx}
                    label={level ? `${name} (${level})` : name}
                    size="small"
                    sx={{
                      bgcolor: "#ffffff",
                      color: "#0369a1",
                      border: "1px solid #bae6fd",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SectionTitle>Опыт</SectionTitle>
            {experience.map((exp, idx) => {
              const period = getWorkPeriod(exp);
              return (
                <Box
                  key={idx}
                  sx={{
                    mb: 2,
                    pl: 2,
                    borderLeft: `3px solid ${primary}`,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      {exp.position || "Должность"}
                    </Typography>
                    {period && (
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {period}
                      </Typography>
                    )}
                  </Box>
                  {exp.company && (
                    <Typography variant="caption" sx={{ color: "#0ea5e9", fontWeight: 600, display: "block", mb: 0.5 }}>
                      {exp.company}
                    </Typography>
                  )}
                  {exp.description && (
                    <Typography variant="body2" sx={{ fontSize: "8.5pt", color: "#475569", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                      {exp.description}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SectionTitle>Образование</SectionTitle>
            {education.map((edu, idx) => {
              const year = getEducationYears(edu);
              return (
                <Box key={idx} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      {edu.institution || "Учебное заведение"}
                    </Typography>
                    {year && (
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {year}
                      </Typography>
                    )}
                  </Box>
                  {edu.degree && (
                    <Typography variant="caption" sx={{ color: "#0ea5e9", fontWeight: 500 }}>
                      {edu.degree}
                    </Typography>
                  )}
                  {edu.institute && (
                    <Typography variant="body2" sx={{ fontSize: "8pt", color: "#64748b" }}>
                      Институт: {edu.institute}
                    </Typography>
                  )}
                  {edu.department && (
                    <Typography variant="body2" sx={{ fontSize: "8pt", color: "#64748b" }}>
                      Кафедра: {edu.department}
                    </Typography>
                  )}
                  {edu.program && (
                    <Typography variant="body2" sx={{ fontSize: "8pt", color: "#64748b" }}>
                      Направление: {edu.program}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Manual Projects */}
        {meaningfulProjects.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SectionTitle>Проекты</SectionTitle>
            {meaningfulProjects.map((proj) => (
              <Box key={proj.id} sx={{ mb: 1.5, p: 1.5, border: "1px solid #e2e8f0", borderRadius: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {proj.name || "Проект"}
                  </Typography>
                  {proj.period && (
                    <Typography variant="caption" sx={{ color: "#64748b" }}>{proj.period}</Typography>
                  )}
                </Box>
                {proj.role && (
                  <Typography variant="caption" sx={{ color: "#0ea5e9", fontWeight: 600, display: "block", mb: 0.5 }}>
                    {proj.role}
                  </Typography>
                )}
                {proj.techStack && (
                  <Typography variant="body2" sx={{ fontSize: "8pt", color: "#64748b", mb: 0.5 }}>
                    Стек: {proj.techStack}
                  </Typography>
                )}
                {proj.description && (
                  <Typography variant="body2" sx={{ fontSize: "8pt", color: "#475569", lineHeight: 1.5 }}>
                    {proj.description}
                  </Typography>
                )}
                {proj.link && (
                  <Typography variant="caption" sx={{ color: "#0ea5e9", mt: 0.5, display: "block" }}>
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
              <Box
                key={idx}
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  border: "1px solid #e2e8f0",
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {repo.name || "Репозиторий"}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {repo.language && (
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {repo.language}
                      </Typography>
                    )}
                    {repo.stars > 0 && (
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        ⭐ {repo.stars}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {repo.description && (
                  <Typography variant="body2" sx={{ fontSize: "8pt", color: "#475569", lineHeight: 1.5 }}>
                    {repo.description}
                  </Typography>
                )}
                {repo.url && (
                  <Typography variant="caption" sx={{ color: "#0ea5e9", mt: 0.5, display: "block" }}>
                    {repo.url.replace(/^https?:\/\//, "")}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
