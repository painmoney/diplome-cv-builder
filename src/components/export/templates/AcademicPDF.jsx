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
    textAlign: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2e7d32',
    paddingBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    color: '#2e7d32',
    marginBottom: 8,
  },
  about: {
    fontSize: 10,
    color: '#555',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  contactInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 8,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  leftColumn: {
    width: '60%',
  },
  rightColumn: {
    width: '40%',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#2e7d32',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2e7d32',
    paddingBottom: 3,
  },
  item: {
    marginBottom: 10,
    paddingLeft: 8,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#2e7d32',
    marginBottom: 2,
  },
  itemYear: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#333',
  },
  skillBox: {
    backgroundColor: '#f1f8e9',
    padding: 5,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#2e7d32',
  },
  skillText: {
    fontSize: 9,
  },
});

export default function AcademicPDF({ data }) {
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
          <Text style={styles.name}>{profile?.name || 'Имя не указано'}</Text>
          {profile?.about && <Text style={styles.about}>{profile.about}</Text>}
          <View style={styles.contactInfo}>
            {profile?.email && <Text>{profile.email}</Text>}
            {profile?.phone && <Text>{profile.phone}</Text>}
          </View>
        </View>

        {/* Two-column layout */}
        <View style={styles.twoColumns}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Education */}
            {education && education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Образование</Text>
                {education.map((edu, idx) => {
                  const year = getEducationYear(edu);
                  return (
                    <View key={idx} style={styles.item}>
                      <Text style={styles.itemTitle}>{edu.degree || 'Степень'}</Text>
                      <Text style={styles.itemSubtitle}>{edu.institution || 'Учебное заведение'}</Text>
                      {year && <Text style={styles.itemYear}>{year}</Text>}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Experience */}
            {experience && experience.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Опыт работы</Text>
                {experience.map((exp, idx) => {
                  const period = getWorkPeriod(exp);
                  return (
                    <View key={idx} style={styles.item}>
                      <Text style={styles.itemTitle}>{exp.position || 'Должность'}</Text>
                      <Text style={styles.itemSubtitle}>{exp.company || 'Компания'}</Text>
                      {period && <Text style={styles.itemYear}>{period}</Text>}
                      {exp.description && <Text style={styles.text}>{exp.description}</Text>}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Skills */}
            {skills && skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Навыки</Text>
                {skills.map((skill, idx) => (
                  <View key={idx} style={styles.skillBox}>
                    <Text style={styles.skillText}>{getSkillName(skill)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* GitHub Projects */}
            {github && github.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Проекты</Text>
                {github.map((repo, idx) => (
                  <View key={idx} style={styles.item}>
                    <Text style={styles.itemTitle}>{repo.name}</Text>
                    {repo.description && <Text style={styles.text}>{repo.description}</Text>}
                    <Text style={styles.itemYear}>{repo.stars || 0} звезд</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
