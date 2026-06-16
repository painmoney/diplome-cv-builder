
import { Box, Typography, Chip, Paper } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import StarIcon from "@mui/icons-material/Star";
import { getSkillName, getSkillLevel, getEducationYears, getWorkPeriod } from "../../utils/helpers";

const SectionTitle = ({ children }) => (
  <Typography
    variant="h5"
    sx={{
      color: "#58a6ff",
      fontWeight: 900,
      fontSize: "1.2rem",
      mb: 2,
      fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
    }}
  >
    {children}
  </Typography>
);

export default function GithubTemplate({ data }) {
  const { profile, skills, education, experience, github } = data || {};
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const meaningfulProjects = projects.filter((p) => p.name || p.description);

  return (
    <Paper
      elevation={0}
      sx={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "18mm",
        backgroundColor: "#0d1117",
        color: "#c9d1d9",
        boxSizing: "border-box",
        fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          pb: 3,
          borderBottom: "1px solid #30363d",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <GitHubIcon sx={{ color: "#58a6ff", fontSize: 34 }} />
          <Typography
            variant="h3"
            sx={{
              color: "#58a6ff",
              fontWeight: 900,
              fontSize: "2rem",
            }}
          >
            {profile?.name || "username"}
          </Typography>
        </Box>

        {profile?.about && (
          <Typography
            variant="body2"
            sx={{
              color: "#8b949e",
              lineHeight: 1.7,
              mb: 1.5,
            }}
          >
            $ {profile.about}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {(() => {
            const links = [];
            if (profile?.email) links.push(`@ ${profile.email}`);
            if (profile?.phone) links.push(`# ${profile.phone}`);
            if (profile?.location) links.push(`loc: ${profile.location}`);
            if (profile?.telegram) {
              const v = String(profile.telegram).trim();
              const m = v.match(/^@?([a-zA-Z0-9_]+)$/);
              links.push(`tg: ${m ? `@${m[1]}` : v}`);
            }
            if (profile?.githubUrl) links.push(`git: ${profile.githubUrl}`);
            if (profile?.linkedin) links.push(`in: ${profile.linkedin}`);
            if (profile?.website) links.push(`web: ${profile.website}`);
            if (profile?.habrCareer) links.push(`habr: ${profile.habrCareer}`);
            return links.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {links.map((text, idx) => (
                  <Typography key={idx} variant="body2" sx={{ color: "#8b949e" }}>
                    {text}{idx < links.length - 1 && " |"}
                  </Typography>
                ))}
              </Box>
            ) : null;
          })()}
        </Box>
      </Box>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle>skills</SectionTitle>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {skills.map((skill, idx) => {
              const name = getSkillName(skill);
              const level = getSkillLevel(skill);

              return (
                <Chip
                  key={idx}
                  label={level ? `${name} ${level}/5` : name}
                  sx={{
                    bgcolor: "#161b22",
                    color: "#58a6ff",
                    border: "1px solid #30363d",
                    fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Manual Projects */}
      {meaningfulProjects.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle>projects</SectionTitle>
          {meaningfulProjects.map((proj) => (
            <Box key={proj.id} sx={{ mb: 2, p: 2, bgcolor: "#161b22", border: "1px solid #30363d", borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: "#58a6ff", fontWeight: 900, fontSize: "1rem", mb: 0.75 }}>
                {proj.name || "project"}
              </Typography>
              {proj.description && (
                <Typography variant="body2" sx={{ color: "#8b949e", lineHeight: 1.6, mb: 1 }}>
                  {proj.description}
                </Typography>
              )}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography variant="body2" sx={{ color: "#8b949e" }}>
                  {[proj.role, proj.period, proj.techStack].filter(Boolean).join(" · ")}
                </Typography>
                {proj.link && (
                  <Typography variant="body2" component="a" href={proj.link} target="_blank" rel="noopener noreferrer" sx={{ color: "#58a6ff", fontSize: "0.85rem", textDecoration: "none" }}>
                    {proj.link.replace(/^https?:\/\//, "")}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* GitHub Projects */}
      {github && github.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle>repositories</SectionTitle>

          {github.map((repo, idx) => (
            <Box
              key={idx}
              sx={{
                mb: 2,
                p: 2,
                bgcolor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "#58a6ff",
                  fontWeight: 900,
                  fontSize: "1rem",
                  mb: 0.75,
                }}
              >
                {repo.name || "repository"}
              </Typography>

              {repo.description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: "#8b949e",
                    lineHeight: 1.6,
                    mb: 1,
                  }}
                >
                  {repo.description}
                </Typography>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <StarIcon sx={{ color: "#8b949e", fontSize: 16 }} />
                <Typography variant="body2" sx={{ color: "#8b949e" }}>
                  {repo.stars || 0} stars
                  {repo.url ? ` | ${repo.url}` : ""}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle>work.log</SectionTitle>

          {experience.map((exp, idx) => {
            const period = getWorkPeriod(exp);

            return (
              <Box
                key={idx}
                sx={{
                  mb: 2.5,
                  pl: 2,
                  borderLeft: "3px solid #30363d",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#c9d1d9",
                    fontWeight: 900,
                    fontSize: "1rem",
                    mb: 0.5,
                  }}
                >
                  {exp.position || "Должность"}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: "#58a6ff",
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
                      color: "#8b949e",
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
                      color: "#8b949e",
                      lineHeight: 1.6,
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

      {/* Education */}
      {education && education.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle>education.md</SectionTitle>

          {education.map((edu, idx) => {
            const year = getEducationYears(edu);

            return (
              <Box
                key={idx}
                sx={{
                  mb: 2.5,
                  p: 2,
                  bgcolor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#58a6ff",
                    fontWeight: 900,
                    fontSize: "1rem",
                    mb: 0.75,
                  }}
                >
                  ## {edu.institution || "Учебное заведение"}
                </Typography>

                {(edu.degree || year) && (
                  <Typography variant="body2" sx={{ color: "#c9d1d9", mb: 0.75 }}>
                    - qualification: {[edu.degree, year].filter(Boolean).join(" | ")}
                  </Typography>
                )}

                {edu.institute && (
                  <Typography variant="body2" sx={{ color: "#8b949e", mb: 0.5 }}>
                    - institute: {edu.institute}
                  </Typography>
                )}

                {edu.department && (
                  <Typography variant="body2" sx={{ color: "#8b949e", mb: 0.5 }}>
                    - department: {edu.department}
                  </Typography>
                )}

                {edu.program && (
                  <Typography variant="body2" sx={{ color: "#8b949e" }}>
                    - program: {edu.program}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}