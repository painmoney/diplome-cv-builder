import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import StarIcon from '@mui/icons-material/Star';

export default function GithubTemplate({ data }) {
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
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '20mm',
        backgroundColor: '#0d1117',
        color: '#c9d1d9',
        boxSizing: 'border-box',
        fontFamily: '"Consolas", "Monaco", "Courier New", monospace'
      }}
    >
      {/* Header - GitHub Style */}
      <Box sx={{ mb: 4, pb: 3, borderBottom: '1px solid #30363d' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <GitHubIcon sx={{ fontSize: 48, color: '#58a6ff' }} />
          <Typography 
            variant="h3" 
            sx={{ 
              fontFamily: '"Consolas", monospace',
              color: '#58a6ff', 
              fontWeight: 'bold', 
              fontSize: '2rem'
            }}
          >
            {profile?.name || 'username'}
          </Typography>
        </Box>
        
        {profile?.about && (
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 2, 
              lineHeight: 1.6,
              color: '#8b949e',
              fontFamily: '"Consolas", monospace',
              fontSize: '0.95rem'
            }}
          >
            <span style={{ color: '#58a6ff' }}>{'$ '}</span>
            {profile.about}
          </Typography>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          color: '#8b949e', 
          fontFamily: '"Consolas", monospace', 
          fontSize: '0.85rem' 
        }}>
          {profile?.email && (
            <Typography variant="body2">
              <span style={{ color: '#58a6ff' }}>{'@ '}</span>
              {profile.email}
            </Typography>
          )}
          {profile?.phone && (
            <Typography variant="body2">
              <span style={{ color: '#58a6ff' }}>{'# '}</span>
              {profile.phone}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Skills - как теги GitHub */}
      {skills && skills.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#58a6ff', 
              fontWeight: 'bold',
              fontFamily: '"Consolas", monospace',
              mb: 2,
              fontSize: '1.1rem'
            }}
          >
            <span style={{ color: '#8b949e' }}>{'<'}</span>
            skills
            <span style={{ color: '#8b949e' }}>{' />'}</span>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {skills.map((skill, idx) => (
              <Chip 
                key={idx} 
                label={getSkillName(skill)} 
                size="small" 
                sx={{ 
                  bgcolor: '#161b22',
                  color: '#58a6ff',
                  border: '1px solid #30363d',
                  fontFamily: '"Consolas", monospace',
                  fontSize: '0.75rem',
                  '&:hover': {
                    borderColor: '#58a6ff'
                  }
                }} 
              />
            ))}
          </Box>
        </Box>
      )}

      {/* GitHub Projects - главный фокус */}
      {github && github.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#58a6ff', 
              fontWeight: 'bold',
              fontFamily: '"Consolas", monospace',
              mb: 2,
              fontSize: '1.1rem'
            }}
          >
            <GitHubIcon sx={{ fontSize: 20, verticalAlign: 'middle', mr: 1 }} />
            repositories
          </Typography>
          {github.map((repo, idx) => (
            <Box 
              key={idx} 
              sx={{ 
                mb: 2,
                p: 2,
                bgcolor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 1,
                transition: 'border-color 0.2s',
                '&:hover': {
                  borderColor: '#58a6ff'
                }
              }}
            >
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#58a6ff',
                  fontFamily: '"Consolas", monospace',
                  mb: 0.5
                }}
              >
                {repo.name}
              </Typography>
              {repo.description && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 1, 
                    color: '#8b949e',
                    fontFamily: '"Consolas", monospace',
                    fontSize: '0.85rem'
                  }}
                >
                  {repo.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ fontSize: 14, color: '#f1e05a' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#8b949e',
                    fontFamily: '"Consolas", monospace'
                  }}
                >
                  {repo.stars || 0} stars
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Experience - как коммиты */}
      {experience && experience.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#58a6ff', 
              fontWeight: 'bold',
              fontFamily: '"Consolas", monospace',
              mb: 2,
              fontSize: '1.1rem'
            }}
          >
            work.log
          </Typography>
          {experience.map((exp, idx) => {
            const period = getWorkPeriod(exp);
            return (
              <Box 
                key={idx} 
                sx={{ 
                  mb: 2,
                  pl: 2,
                  borderLeft: '2px solid #30363d'
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: '#c9d1d9',
                    fontFamily: '"Consolas", monospace'
                  }}
                >
                  {exp.position || 'Position'}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#58a6ff',
                    fontFamily: '"Consolas", monospace',
                    fontSize: '0.85rem'
                  }}
                >
                  {exp.company || 'Company'}
                </Typography>
                {period && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#8b949e',
                      fontFamily: '"Consolas", monospace',
                      display: 'block',
                      mb: 0.5
                    }}
                  >
                    {period}
                  </Typography>
                )}
                {exp.description && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#8b949e',
                      fontFamily: '"Consolas", monospace',
                      fontSize: '0.85rem',
                      lineHeight: 1.5
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
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#58a6ff', 
              fontWeight: 'bold',
              fontFamily: '"Consolas", monospace',
              mb: 2,
              fontSize: '1.1rem'
            }}
          >
            education.md
          </Typography>
          {education.map((edu, idx) => {
            const year = getEducationYear(edu);
            return (
              <Box key={idx} sx={{ mb: 2, pl: 2 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: '#c9d1d9',
                    fontFamily: '"Consolas", monospace'
                  }}
                >
                  {edu.degree || 'Degree'}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#8b949e',
                    fontFamily: '"Consolas", monospace',
                    fontSize: '0.85rem'
                  }}
                >
                  {edu.institution || 'Institution'}
                  {year && ` • ${year}`}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
