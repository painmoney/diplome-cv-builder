import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#24292e',
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    color: '#0969da',
    marginBottom: 5,
  },
  about: {
    fontSize: 10,
    color: '#57606a',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  contactInfo: {
    fontSize: 9,
    color: '#57606a',
    marginTop: 5,
  },
  contactLine: {
    marginBottom: 2,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0969da',
    marginBottom: 8,
  },
  repoBox: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f6f8fa',
    borderWidth: 1,
    borderColor: '#d0d7de',
  },
  repoName: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0969da',
    marginBottom: 3,
  },
  repoDesc: {
    fontSize: 9,
    color: '#57606a',
    marginBottom: 5,
    lineHeight: 1.4,
  },
  repoStars: {
    fontSize: 8,
    color: '#57606a',
  },
  item: {
    marginBottom: 10,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#d0d7de',
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#0969da',
    marginBottom: 2,
  },
  itemPeriod: {
    fontSize: 8,
    color: '#57606a',
    marginBottom: 3,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#57606a',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  skill: {
    backgroundColor: '#ddf4ff',
    color: '#0969da',
    padding: 5,
    marginRight: 5,
    marginBottom: 5,
    fontSize: 8,
    borderWidth: 1,
    borderColor: '#54aeff',
  },
});

export default function GithubPDF({ data }) {
  const { profile, skills, education, experience, github } = data || {};

  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill;
    if (skill?.name) return skill.name;
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
              {skills.map((skill, idx) => (
                <Text key={idx} style={styles.skill}>
                  {getSkillName(skill)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* GitHub Projects */}
        {github && github.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>repositories</Text>
            {github.map((repo, idx) => (
              <View key={idx} style={styles.repoBox}>
                <Text style={styles.repoName}>{repo.name}</Text>
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
                    {edu.degree || 'Степень'}
                  </Text>
                  <Text style={styles.text}>
                    {edu.institution || 'Учебное заведение'}
                    {year && ` • ${year}`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Page>
    </Document>
  );
}
