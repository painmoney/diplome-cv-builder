
import { Document, Page, Text, View, Link, StyleSheet, Font } from '@react-pdf/renderer';
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
  repoUrl: {
    fontSize: 8,
    color: '#2e7d32',
    marginBottom: 3,
  },
});

export default function AcademicPDF({ data }) {
  const { profile, skills, education, experience, github } = data || {};
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const meaningfulProjects = projects.filter((p) => p.name || p.description);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile?.name || 'Имя не указано'}</Text>
          {profile?.about && <Text style={styles.about}>{profile.about}</Text>}
          <View style={styles.contactInfo}>
            {(() => {
              const links = buildProfileContactLinks(profile);
              if (!links.length) return null;
              return <Text>{links.map((l) => l.value).join(" | ")}</Text>;
            })()}
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
                  const year = getEducationYears(edu);

                  return (
                    <View key={idx} style={styles.item}>
                      <Text style={styles.itemTitle}>
                        {edu.institution || 'Учебное заведение'}
                      </Text>

                      {edu.degree && (
                        <Text style={styles.itemSubtitle}>{edu.degree}</Text>
                      )}

                      {year && <Text style={styles.itemYear}>{year}</Text>}

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
                {skills.map((skill, idx) => {
                  const name = getSkillName(skill);
                  const level = getSkillLevel(skill);

                  return (
                    <View key={idx} style={styles.skillBox}>
                      <Text style={styles.skillText}>
                        {level ? `${name} — ${level}/5` : name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Manual Projects */}
            {meaningfulProjects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Проекты</Text>
                {meaningfulProjects.map((proj, idx) => (
                  <View key={idx} style={styles.item}>
                    <Text style={styles.itemTitle}>{proj.name || 'Проект'}</Text>
                    <Text style={styles.itemSubtitle}>
                      {[proj.role, proj.period].filter(Boolean).join(' | ')}
                    </Text>
                    {proj.techStack && <Text style={styles.text}>Стек: {proj.techStack}</Text>}
                    {proj.description && <Text style={styles.text}>{proj.description}</Text>}
                    {proj.link && <Text style={styles.repoUrl}>{proj.link}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* GitHub Projects */}
            {github && github.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>GitHub проекты</Text>
                {github.map((repo, idx) => (
                  <View key={idx} style={styles.item}>
                    {repo.url ? (
                      <Link src={repo.url} style={{ ...styles.itemTitle, textDecoration: 'none', color: '#2e7d32' }}>
                        {repo.name}
                      </Link>
                    ) : (
                      <Text style={styles.itemTitle}>{repo.name}</Text>
                    )}
                    {repo.url && (
                      <Text style={styles.repoUrl}>{repo.url.replace(/^https?:\/\//, '')}</Text>
                    )}
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
