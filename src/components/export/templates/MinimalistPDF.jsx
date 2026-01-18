import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Регистрируем шрифт с поддержкой кириллицы
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Roboto',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1976d2',
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  },
  contactLine: {
    marginBottom: 3,
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1976d2',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'solid',
    paddingBottom: 3,
  },
  item: {
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 3,
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skill: {
    backgroundColor: '#e3f2fd',
    padding: 5,
    paddingHorizontal: 10,
    marginRight: 5,
    marginBottom: 5,
    borderRadius: 3,
    fontSize: 9,
  },
});

export default function MinimalistPDF({ data }) {
  const { profile, skills, education, experience, github } = data || {};

  const getSkillName = (skill) => {
    if (typeof skill === 'string') return skill;
    if (skill && typeof skill === 'object') return skill.name || '';
    return '';
  };

  const getEducationYear = (edu) => {
    // Все возможные варианты полей
    if (edu.year) return edu.year;
    if (edu.graduationYear) return edu.graduationYear;
    if (edu.years) return edu.years;
    if (edu.period) return edu.period;
    if (edu.startYear && edu.endYear) return `${edu.startYear}-${edu.endYear}`;
    return '';
  };

  const getWorkPeriod = (exp) => {
    // Все возможные варианты
    if (exp.period) return exp.period;
    
    const start = exp.startDate || exp.start || exp.from || '';
    const end = exp.endDate || exp.end || exp.to || '';
    
    if (!start && !end) return '';
    if (start && end) return `${start} - ${end}`;
    if (start && exp.current) return `${start} - Настоящее время`;
    if (start) return start;
    if (end) return end;
    return '';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile?.name || 'Имя не указано'}</Text>
          {profile?.about && <Text style={styles.text}>{profile.about}</Text>}
          <View style={styles.contactInfo}>
            {profile?.email && (
              <Text style={styles.contactLine}>Email: {profile.email}</Text>
            )}
            {profile?.phone && (
              <Text style={styles.contactLine}>Телефон: {profile.phone}</Text>
            )}
          </View>
        </View>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Навыки</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill, idx) => (
                <Text key={idx} style={styles.skill}>
                  {getSkillName(skill)}
                </Text>
              ))}
            </View>
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
                  <Text style={styles.itemTitle}>
                    {exp.position || 'Должность'}
                  </Text>
                  <Text style={styles.itemSubtitle}>
                    {exp.company || 'Компания'}
                    {period && ` | ${period}`}
                  </Text>
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
            <Text style={styles.sectionTitle}>Образование</Text>
            {education.map((edu, idx) => {
              const year = getEducationYear(edu);
              return (
                <View key={idx} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    {edu.degree || 'Степень'}
                  </Text>
                  <Text style={styles.itemSubtitle}>
                    {edu.institution || 'Учебное заведение'}
                    {year && ` | ${year}`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* GitHub Projects */}
        {github && github.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GitHub Проекты</Text>
            {github.map((repo, idx) => (
              <View key={idx} style={styles.item}>
                <Text style={styles.itemTitle}>{repo.name}</Text>
                {repo.description && (
                  <Text style={styles.text}>{repo.description}</Text>
                )}
                <Text style={styles.itemSubtitle}>
                  {repo.stars || 0} stars
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
