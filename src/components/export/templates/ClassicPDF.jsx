
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { getSkillName, getSkillLevel, getEducationYears, getWorkPeriod, buildProfileContactLinks } from '../../../utils/helpers';

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
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  name: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 5,
  },
  about: {
    fontSize: 9,
    marginTop: 5,
    lineHeight: 1.4,
  },
  contactInfo: {
    fontSize: 8,
    marginTop: 5,
  },
  contactLine: {
    fontSize: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  item: {
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 9,
    color: '#555555',
    marginBottom: 2,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  skills: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  repoName: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 2,
  },
  repoDesc: {
    fontSize: 8,
    color: '#333333',
  },
});

export default function ClassicPDF({ data }) {
  const { profile, skills, education, experience, github } = data || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile?.name || 'Имя не указано'}</Text>
          <View style={styles.contactInfo}>
            {(() => {
              const links = buildProfileContactLinks(profile);
              if (!links.length) return null;
              const contactText = links.map((l) => l.value).join("  •  ");
              return <Text style={styles.contactLine}>{contactText}</Text>;
            })()}
          </View>
          {profile?.about && <Text style={styles.about}>{profile.about}</Text>}
        </View>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Навыки</Text>
            <Text style={styles.skills}>
              {skills.map((skill) => {
                const name = getSkillName(skill);
                const level = getSkillLevel(skill);
                return `${name}${level ? ` (${level}/5)` : ""}`;
              }).join(' • ')}
            </Text>
          </View>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Опыт работы</Text>
            {experience.map((exp, idx) => {
              const period = getWorkPeriod(exp);
              return (
                <View key={idx} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    {exp.position || 'Должность'}{exp.company ? `, ${exp.company}` : ''}{period ? ` — ${period}` : ''}
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
          <View>
            <Text style={styles.sectionTitle}>Образование</Text>
            {education.map((edu, idx) => {
              const year = getEducationYears(edu);
              return (
                <View key={idx} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    {edu.institution || 'Учебное заведение'}{edu.degree ? `, ${edu.degree}` : ''}{year ? ` — ${year}` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* GitHub Projects */}
        {github && github.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Проекты</Text>
            {github.map((repo, idx) => (
              <View key={idx} style={styles.item}>
                <Text style={styles.repoName}>
                  {repo.name || 'Репозиторий'}{repo.language ? ` — ${repo.language}` : ''}{repo.stars ? ` (${repo.stars} stars)` : ''}
                </Text>
                {repo.description && (
                  <Text style={styles.repoDesc}>{repo.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
