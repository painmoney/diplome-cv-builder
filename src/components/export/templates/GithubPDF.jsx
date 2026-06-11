import React from 'react';
import { Document, Page, Text, View, Link, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-sans@0.2.3/NotoSans_400Regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-sans@0.2.3/NotoSans_700Bold.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'NotoSans',
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
  },

  name: {
    fontSize: 24,
    fontWeight: 700,
    color: '#58a6ff',
    marginBottom: 5,
  },

  about: {
    fontSize: 10,
    color: '#8b949e',
    marginBottom: 10,
    lineHeight: 1.5,
  },

  contactInfo: {
    fontSize: 9,
    color: '#8b949e',
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#58a6ff',
    marginBottom: 8,
  },

  repoBox: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
  },

  repoName: {
    fontSize: 11,
    fontWeight: 700,
    color: '#58a6ff',
    marginBottom: 3,
  },

  repoDesc: {
    fontSize: 9,
    color: '#8b949e',
    marginBottom: 5,
    lineHeight: 1.4,
  },

  repoStars: {
    fontSize: 8,
    color: '#8b949e',
  },

  item: {
    marginBottom: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#30363d',
  },

  itemTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
    color: '#c9d1d9',
  },

  itemSubtitle: {
    fontSize: 10,
    color: '#58a6ff',
    marginBottom: 2,
  },

  itemPeriod: {
    fontSize: 8,
    color: '#8b949e',
    marginBottom: 3,
  },

  text: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#8b949e',
  },

  skill: {
    backgroundColor: '#161b22',
    color: '#58a6ff',
    padding: 5,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  repoUrl: {
    fontSize: 8,
    color: '#58a6ff',
    marginBottom: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
});

export default function GithubPDF({ data }) {
  const { profile, skills, education, experience, github } = data || {};

  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill;
    if (skill?.name) return skill.name;
    return '';
  };

  const getSkillLevel = (skill) => {
    if (skill && typeof skill === 'object' && skill.level) return skill.level;
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
    return start || '';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile?.name || 'username'}</Text>
          {profile?.about && (
            <Text style={styles.about}>$ {profile.about}</Text>
          )}
          <View style={styles.contactInfo}>
            {profile?.email && (
              <Text style={styles.contactLine}>@ {profile.email}</Text>
            )}
            {profile?.phone && (
              <Text style={styles.contactLine}># {profile.phone}</Text>
            )}
          </View>
        </View>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill, idx) => {
                const name = getSkillName(skill);
                const level = getSkillLevel(skill);

                return (
                  <Text key={idx} style={styles.skill}>
                    {level ? `${name} — ${level}/5` : name}
                  </Text>
                );
              })}
            </View>
          </View>
        )}

        {/* GitHub Projects */}
        {github && github.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>repositories</Text>
            {github.map((repo, idx) => (
              <View key={idx} style={styles.repoBox}>
                {repo.url ? (
                  <Link src={repo.url} style={{ ...styles.repoName, textDecoration: 'none' }}>
                    {repo.name}
                  </Link>
                ) : (
                  <Text style={styles.repoName}>{repo.name}</Text>
                )}
                {repo.url && (
                  <Text style={styles.repoUrl}>{repo.url.replace(/^https?:\/\//, '')}</Text>
                )}
                {repo.description && (
                  <Text style={styles.repoDesc}>{repo.description}</Text>
                )}
                <Text style={styles.repoStars}>★ {repo.stars || 0} звезд</Text>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>work.log</Text>
            {experience.map((exp, idx) => {
              const period = getWorkPeriod(exp);
              return (
                <View key={idx} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    {exp.position || 'Должность'}
                  </Text>
                  <Text style={styles.itemSubtitle}>
                    {exp.company || 'Компания'}
                  </Text>
                  {period && (
                    <Text style={styles.itemPeriod}>{period}</Text>
                  )}
                  {exp.description && (
                    <Text style={styles.text}>{exp.description}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>education.md</Text>
            {education.map((edu, idx) => {
              const year = getEducationYear(edu);

              return (
                <View key={idx} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    {edu.institution || 'Учебное заведение'}
                  </Text>

                  <Text style={styles.text}>
                    {[edu.degree, year].filter(Boolean).join(' • ')}
                  </Text>

                  {edu.institute && (
                    <Text style={styles.text}>Институт: {edu.institute}</Text>
                  )}

                  {edu.department && (
                    <Text style={styles.text}>Кафедра: {edu.department}</Text>
                  )}

                  {edu.program && (
                    <Text style={styles.text}>
                      Направление подготовки/специальности: {edu.program}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Page>
    </Document>
  );
}
