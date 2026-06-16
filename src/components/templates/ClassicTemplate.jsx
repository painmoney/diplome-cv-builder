
import { Box, Typography } from "@mui/material";
import { getSkillName, getSkillLevel, getEducationYears, getWorkPeriod, buildProfileContactLinks } from "../../utils/helpers";

const SectionTitle = ({ children }) => (
  <Typography
    variant="h6"
    sx={{
      fontWeight: 700,
      fontSize: "1rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      mb: 1,
      mt: 3,
      pb: 0.5,
      borderBottom: "1px solid #000",
    }}
  >
    {children}
  </Typography>
);

export default function ClassicTemplate({ data }) {
  const { profile, skills, education, experience, github } = data || {};

  return (
    <Box
      sx={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "15mm 20mm",
        backgroundColor: "#ffffff",
        color: "#000000",
        boxSizing: "border-box",
        fontFamily: '"Times New Roman", "Georgia", serif',
        fontSize: "11pt",
        lineHeight: 1.4,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2, pb: 1.5, borderBottom: "2px solid #000" }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: "18pt",
            mb: 0.5,
          }}
        >
          {profile?.name || "Имя не указано"}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", mb: 1 }}>
          {buildProfileContactLinks(profile).map((link, idx, arr) => (
            <Box key={link.type} sx={{ display: "inline-flex", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontSize: "9pt" }}>
                {link.value}
              </Typography>
              {idx < arr.length - 1 && (
                <Typography variant="body2" sx={{ mx: 0.5, fontSize: "9pt" }}>•</Typography>
              )}
            </Box>
          ))}
        </Box>

        {profile?.about && (
          <Typography variant="body2" sx={{ fontSize: "10pt", mt: 1 }}>
            {profile.about}
          </Typography>
        )}
      </Box>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <SectionTitle>Навыки</SectionTitle>
          <Typography variant="body2" sx={{ fontSize: "10pt" }}>
            {skills.map((skill) => {
              const name = getSkillName(skill);
              const level = getSkillLevel(skill);
              return `${name}${level ? ` (${level}/5)` : ""}`;
            }).join(" • ")}
          </Typography>
        </Box>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <SectionTitle>Опыт работы</SectionTitle>
          {experience.map((exp) => {
            const period = getWorkPeriod(exp);
            return (
              <Box key={exp.company || exp.position} sx={{ mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "10.5pt" }}>
                  {exp.position || "Должность"}{exp.company ? `, ${exp.company}` : ""}{period ? ` — ${period}` : ""}
                </Typography>
                {exp.description && (
                  <Typography variant="body2" sx={{ fontSize: "10pt", mt: 0.25, whiteSpace: "pre-line" }}>
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
        <Box sx={{ mb: 2 }}>
          <SectionTitle>Образование</SectionTitle>
          {education.map((edu, idx) => {
            const year = getEducationYears(edu);
            return (
              <Box key={idx} sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ fontSize: "10pt" }}>
                  <b>{edu.institution || "Учебное заведение"}</b>
                  {edu.degree ? `, ${edu.degree}` : ""}{year ? ` — ${year}` : ""}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* GitHub Projects */}
      {github && github.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <SectionTitle>Проекты</SectionTitle>
          {github.map((repo, idx) => (
            <Box key={idx} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "10pt" }}>
                {repo.name || "Репозиторий"}
                {repo.language ? ` — ${repo.language}` : ""}
                {repo.stars ? ` (${repo.stars} stars)` : ""}
              </Typography>
              {repo.description && (
                <Typography variant="body2" sx={{ fontSize: "10pt", color: "#333" }}>
                  {repo.description}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
