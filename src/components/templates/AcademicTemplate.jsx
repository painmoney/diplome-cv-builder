import React from 'react';
import { Box, Typography, Chip, Divider, Paper, Grid } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import CodeIcon from '@mui/icons-material/Code';

export default function AcademicTemplate({ data }) {
  const { profile, skills, education, experience, github } = data || {};

  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill;
    if (skill && typeof skill === 'object') return skill.name || '';
    return '';
  };

  const getEducationYear = (edu) => {
    if (edu.years) return edu.years;
    if (edu.year) return edu.year;
    if (edu.startYear && edu.endYear) return `${edu.startYear}-${edu.endYear}`;
    return '';
  };

  const getWorkPeriod = (exp) => {
    if (exp.period) return exp.period;
    const start = exp.startDate || '';
    const end = exp.endDate || '';
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    return '';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "20mm",
        backgroundColor: "white",
        color: "#111", // ✅
        boxSizing: "border-box",
        fontFamily: '"Georgia", "Times New Roman", serif',
      }}
    >

      {/* Header - Academic Style */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4, 
        pb: 3,
        borderBottom: '3px double #2e7d32'
      }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontFamily: '"Georgia", serif',
            color: '#2e7d32', 
            fontWeight: 'bold', 
            mb: 1,
            fontSize: '2.2rem',
            textTransform: 'uppercase',
            letterSpacing: 2
          }}
        >
          {profile?.name || 'Имя не указано'}
        </Typography>
        
        {profile?.about && (
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 2, 
              lineHeight: 1.8,
              fontStyle: 'italic',
              color: '#555',
              maxWidth: '80%',
              mx: 'auto'
            }}
          >
            {profile.about}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, color: '#666', mt: 2 }}>
          {profile?.email && (
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              {profile.email}
            </Typography>
          )}
          {profile?.phone && (
            <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
              {profile.phone}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Two-column layout */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={7}>
          {/* Education */}
          {education && education.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ color: '#2e7d32', mr: 1 }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#2e7d32', 
                    fontWeight: 'bold',
                    fontFamily: '"Georgia", serif',
                    fontSize: '1.3rem'
                  }}
                >
                  Образование
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, borderColor: '#2e7d32' }} />
              {education.map((edu, idx) => {
                const year = getEducationYear(edu);
                return (
                  <Box key={idx} sx={{ mb: 3, pl: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {edu.degree || 'Степень'}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                      {edu.institution || 'Учебное заведение'}
                    </Typography>
                    {year && (
                      <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                        {year}
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WorkIcon sx={{ color: '#2e7d32', mr: 1 }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#2e7d32', 
                    fontWeight: 'bold',
                    fontFamily: '"Georgia", serif',
                    fontSize: '1.3rem'
                  }}
                >
                  Опыт работы
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, borderColor: '#2e7d32' }} />
              {experience.map((exp, idx) => {
                const period = getWorkPeriod(exp);
                return (
                  <Box key={idx} sx={{ mb: 3, pl: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {exp.position || 'Должность'}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                      {exp.company || 'Компания'}
                    </Typography>
                    {period && (
                      <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', mb: 1 }}>
                        {period}
                      </Typography>
                    )}
                    {exp.description && (
                      <Typography variant="body2" sx={{ lineHeight: 1.7, textAlign: 'justify' }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CodeIcon sx={{ color: '#2e7d32', mr: 1 }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#2e7d32', 
                    fontWeight: 'bold',
                    fontFamily: '"Georgia", serif',
                    fontSize: '1.3rem'
                  }}
                >
                  Навыки
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, borderColor: '#2e7d32' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {skills.map((skill, idx) => (
                  <Box 
                    key={idx} 
                    sx={{ 
                      bgcolor: '#f1f8e9',
                      p: 1,
                      borderLeft: '3px solid #2e7d32'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getSkillName(skill)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* GitHub Projects */}
          {github && github.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#2e7d32', 
                  fontWeight: 'bold',
                  fontFamily: '"Georgia", serif',
                  fontSize: '1.3rem',
                  mb: 2
                }}
              >
                Проекты
              </Typography>
              <Divider sx={{ mb: 2, borderColor: '#2e7d32' }} />
              {github.map((repo, idx) => (
                <Box key={idx} sx={{ mb: 2, pl: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {repo.name}
                  </Typography>
                  {repo.description && (
                    <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                      {repo.description}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: '#2e7d32' }}>
                    ⭐ {repo.stars || 0}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
