
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { getSkillName, getSkillLevel, getEducationYears, getWorkPeriod, buildProfileContactLinks } from '../../../utils/helpers';
import PdfResumeAvatar from './PdfResumeAvatar';

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
    padding: 0,
    fontSize: 10,
    fontFamily: 'NotoSans',
    backgroundColor: '#ffffff',
  },
  headerBand: {
    position: 'relative',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 40,
    paddingTop: 30,
    paddingBottom: 24,
  },
  headerBandWithAvatar: {
    minHeight: 94,
    paddingRight: 116,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: 6,
  },
  contactInfo: {
    fontSize: 9,
    color: '#e0f2fe',
  },
  contactLine: {
    fontSize: 9,
    color: '#e0f2fe',
    marginBottom: 2,
  },
  body: {
    paddingHorizontal: 40,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
    marginBottom: 8,
  },
  section: {
    marginBottom: 14,
  },
  skillsBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skill: {
    backgroundColor: '#ffffff',
    color: '#0369a1',
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: 3,
    paddingHorizontal: 8,
    fontSize: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  expBlock: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#0ea5e9',
  },
  expTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  expCompany: {
    fontSize: 9,
    color: '#0ea5e9',
    fontWeight: 600,
    marginBottom: 3,
  },
  expPeriod: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 3,
  },
  expDesc: {
    fontSize: 8.5,
    color: '#475569',
    lineHeight: 1.4,
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
    color: '#64748b',
    marginBottom: 2,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#475569',
  },
  repoBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    marginBottom: 8,
  },
  repoName: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  repoMeta: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 2,
  },
  repoDesc: {
    fontSize: 8,
    color: '#475569',
  },
  repoUrl: {
    fontSize: 8,
    color: '#0ea5e9',
    marginTop: 3,
  },
});

export default function ModernPDF({ data }) {
  const { profile, skills, education, experience, github } = data || {};
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const meaningfulProjects = projects.filter((p) => p.name || p.description);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Accent header band */}
        <View style={[styles.headerBand, profile?.photo && styles.headerBandWithAvatar]}>
          <PdfResumeAvatar
            profile={profile}
            borderColor="#e0f2fe"
            style={{ top: 30, right: 40 }}
          />
          <Text style={styles.name}>{profile?.name || 'Имя не указано'}</Text>
          <View style={styles.contactInfo}>
            {(() => {
              const links = buildProfileContactLinks(profile);
              if (!links.length) return null;
              const contactText = links.map((l) => l.value).join("  •  ");
              return <Text style={styles.contactLine}>{contactText}</Text>;
            })()}
          </View>
        </View>

        <View style={styles.body}>
          {/* About */}
          {profile?.about && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>О себе</Text>
              <Text style={styles.text}>{profile.about}</Text>
            </View>
          )}

          {/* Tech Stack */}
          {skills && skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Технологический стек</Text>
              <View style={styles.skillsBox}>
                {skills.map((skill, idx) => {
                  const name = getSkillName(skill);
                  const level = getSkillLevel(skill);
                  return (
                    <Text key={idx} style={styles.skill}>
                      {level ? `${name} (${level})` : name}
                    </Text>
                  );
                })}
              </View>
            </View>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Опыт</Text>
              {experience.map((exp, idx) => {
                const period = getWorkPeriod(exp);
                return (
                  <View key={idx} style={styles.expBlock}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={styles.expTitle}>{exp.position || 'Должность'}</Text>
                      {period && <Text style={styles.expPeriod}>{period}</Text>}
                    </View>
                    {exp.company && <Text style={styles.expCompany}>{exp.company}</Text>}
                    {exp.description && <Text style={styles.expDesc}>{exp.description}</Text>}
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={styles.itemTitle}>{edu.institution || 'Учебное заведение'}</Text>
                      {year && <Text style={styles.itemSubtitle}>{year}</Text>}
                    </View>
                    {edu.degree && <Text style={{ fontSize: 9, color: '#0ea5e9', fontWeight: 600 }}>{edu.degree}</Text>}
                    {edu.institute && <Text style={{ fontSize: 8, color: '#64748b' }}>Институт: {edu.institute}</Text>}
                    {edu.department && <Text style={{ fontSize: 8, color: '#64748b' }}>Кафедра: {edu.department}</Text>}
                    {edu.program && <Text style={{ fontSize: 8, color: '#64748b' }}>Направление: {edu.program}</Text>}
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
                <View key={idx} style={styles.repoBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={styles.repoName}>{proj.name || 'Проект'}</Text>
                    {proj.period && <Text style={styles.repoMeta}>{proj.period}</Text>}
                  </View>
                  {proj.role && <Text style={{ fontSize: 8, color: '#0ea5e9', fontWeight: 600, marginBottom: 2 }}>{proj.role}</Text>}
                  {proj.techStack && <Text style={styles.repoMeta}>Стек: {proj.techStack}</Text>}
                  {proj.description && <Text style={styles.repoDesc}>{proj.description}</Text>}
                  {proj.link && <Text style={styles.repoUrl}>{proj.link.replace(/^https?:\/\//, '')}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* GitHub Projects */}
          {github && github.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GitHub проекты</Text>
              {github.map((repo, idx) => (
                <View key={idx} style={styles.repoBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={styles.repoName}>{repo.name || 'Репозиторий'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {repo.language && <Text style={styles.repoMeta}>{repo.language}</Text>}
                      {repo.stars > 0 && <Text style={styles.repoMeta}>{repo.stars} stars</Text>}
                    </View>
                  </View>
                  {repo.description && <Text style={styles.repoDesc}>{repo.description}</Text>}
                  {repo.url && <Text style={styles.repoUrl}>{repo.url.replace(/^https?:\/\//, '')}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
