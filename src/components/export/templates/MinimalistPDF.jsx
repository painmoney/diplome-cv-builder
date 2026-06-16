
import { Document, Page, Text, View, Link, StyleSheet, Font } from '@react-pdf/renderer';
import { getSkillName, getSkillLevel, getEducationYears, getWorkPeriod, buildProfileContactLinks } from '../../../utils/helpers';

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
  repoUrl: {
    fontSize: 9,
    color: '#1976d2',
    marginBottom: 3,
  },
});

export default function MinimalistPDF({ data }) {
  const { profile, skills, education, experience, github } = data || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile?.name || 'Имя не указано'}</Text>
          {profile?.about && <Text style={styles.text}>{profile.about}</Text>}
          <View style={styles.contactInfo}>
            {(() => {
              const links = buildProfileContactLinks(profile);
              if (!links.length) return null;
              const contactText = links.map((l) => l.value).join("  •  ");
              return <Text style={styles.contactLine}>{contactText}</Text>;
            })()}
          </View>
        </View>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Навыки</Text>
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
              const year = getEducationYears(edu);

              return (
                <View key={idx} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    {edu.institution || 'Учебное заведение'}
                  </Text>

                  <Text style={styles.itemSubtitle}>
                    {[year, edu.degree].filter(Boolean).join(' | ')}
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

        {/* GitHub Projects */}
        {github && github.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GitHub Проекты</Text>
            {github.map((repo, idx) => (
              <View key={idx} style={styles.item}>
                {repo.url ? (
                  <Link src={repo.url} style={{ ...styles.itemTitle, textDecoration: 'none', color: '#1976d2' }}>
                    {repo.name}
                  </Link>
                ) : (
                  <Text style={styles.itemTitle}>{repo.name}</Text>
                )}
                {repo.url && (
                  <Text style={styles.repoUrl}>{repo.url.replace(/^https?:\/\//, '')}</Text>
                )}
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
