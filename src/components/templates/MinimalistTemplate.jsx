import React from 'react';
import { Box, Typography, Chip, Divider, Paper } from '@mui/material';

export default function MinimalistTemplate({ data }) {
  const { profile, skills, education, experience, github } = data || {};

  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill;
    if (skill && typeof skill === 'object') return skill.name || '';
    return '';
  };

  const getEducationYear = (edu) => {
    if (edu.year) return edu.year;
    if (edu.startYear && edu.endYear) return `${edu.startYear}-${edu.endYear}`;
    if (edu.startYear) return edu.startYear;
    return '';
  };

  const getWorkPeriod = (exp) => {
    const start = exp.startDate || '';
    const end = exp.endDate || exp.current ? 'Настоящее время' : '';
    
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    if (end) return end;
    return '';
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '20mm',
        backgroundColor: 'white',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4, borderBottom: '3px solid #1976d2', pb: 2 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            color: '#1976d2', 
            fontWeight: 'bold', 
            mb: 2,
            fontSize: '2rem'
          }}
        >
          {profile?.name || 'Имя не указано'}
        </Typography>
        
        {profile?.about && (
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            {profile.about}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, color: '#666' }}>
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
              color: '#1976d2', 
              fontWeight: 'bold', 
              mb: 2,
              fontSize: '1.25rem'
            }}
          >
            Навыки
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {skills.map((skill, idx) => (
              <Chip 
                key={idx} 
                label={getSkillName(skill)} 
                size="medium" 
                sx={{ 
                  bgcolor: '#e3f2fd',
                  fontSize: '0.875rem'
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
              color: '#1976d2', 
              fontWeight: 'bold', 
              mb: 2,
              fontSize: '1.25rem'
            }}
          >
            Опыт работы
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {experience.map((exp, idx) => {
            const period = getWorkPeriod(exp);
            return (
              <Box key={idx} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {exp.position || 'Должность'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                  {exp.company || 'Компания'}
                  {period && ` | ${period}`}
                </Typography>
                {exp.description && (
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
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
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#1976d2', 
              fontWeight: 'bold', 
              mb: 2,
              fontSize: '1.25rem'
            }}
          >
            Образование
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {education.map((edu, idx) => {
            const year = getEducationYear(edu);
            return (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {edu.degree || 'Степень'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {edu.institution || 'Учебное заведение'}
                  {year && ` | ${year}`}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* GitHub Projects */}
      {github && github.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#1976d2', 
              fontWeight: 'bold', 
              mb: 2,
              fontSize: '1.25rem'
            }}
          >
            GitHub Проекты
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {github.map((repo, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {repo.name}
              </Typography>
              {repo.description && (
                <Typography variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }}>
                  {repo.description}
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: '#666' }}>
                ⭐ {repo.stars || 0} stars
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
