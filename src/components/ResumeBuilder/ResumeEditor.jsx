// src/pages/ResumeEditor.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, Tabs, Tab, Box, Button, Typography, Card, CardContent
} from '@mui/material';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ProfileForm from '../components/profile/ProfileForm';
import EducationBlock from '../components/ResumeBuilder/EducationBlock';
import SkillsBlock from '../components/ResumeBuilder/SkillsBlock';
import ExperienceBlock from '../components/ResumeBuilder/ExperienceBlock';
import GitHubBlock from '../components/ResumeBuilder/GitHubBlock';
import TemplateSelector from '../components/ResumeBuilder/TemplateSelector';

export default function ResumeEditor() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [resumeData, setResumeData] = useState({
    profile: { name: '', photo: '', summary: '' },
    education: [],
    skills: [],
    experience: [],
    github: [],
    template: 'minimalist',
    recommendations: []
  });
  const [loading, setLoading] = useState(false);

  // Загрузка данных при монтировании
  useEffect(() => {
    loadResumeData();
  }, [user]);

  const loadResumeData = async () => {
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) setResumeData(data.data);
  };

  const updateSection = (section, data) => {
    setResumeData(prev => ({ ...prev, [section]: data }));
  };

  const saveResume = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('resumes')
      .upsert({ 
        user_id: user.id, 
        data: resumeData,
        updated_at: new Date().toISOString()
      });
    setLoading(false);
    if (!error) alert('Резюме сохранено!');
  };

  return (
    <Container sx={{ mt: 4, maxWidth: 1200 }}>
      <Typography variant="h4" gutterBottom>Редактор резюме</Typography>
      
      <TemplateSelector 
        value={resumeData.template}
        onChange={(template) => updateSection('template', template)}
      />
      
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 4 }}>
        <Tab label="Профиль" />
        <Tab label="Образование" />
        <Tab label="Навыки" />
        <Tab label="Опыт работы" />
        <Tab label="GitHub" />
      </Tabs>

      <Box sx={{ mb: 4 }}>
        {activeTab === 0 && (
          <ProfileForm 
            data={resumeData.profile}
            onChange={(data) => updateSection('profile', data)}
          />
        )}
        {activeTab === 1 && (
          <EducationBlock 
            data={resumeData.education}
            onChange={(data) => updateSection('education', data)}
          />
        )}
        {activeTab === 2 && (
          <SkillsBlock 
            data={resumeData.skills}
            onChange={(data) => updateSection('skills', data)}
          />
        )}
        {activeTab === 3 && (
          <ExperienceBlock 
            data={resumeData.experience}
            onChange={(data) => updateSection('experience', data)}
          />
        )}
        {activeTab === 4 && (
          <GitHubBlock 
            data={resumeData.github}
            onChange={(data) => updateSection('github', data)}
          />
        )}
      </Box>

      <Button 
        variant="contained" 
        size="large"
        onClick={saveResume}
        disabled={loading}
        sx={{ mr: 2 }}
      >
        {loading ? 'Сохранение...' : 'Сохранить резюме'}
      </Button>
      
      <Button variant="outlined" size="large">
        Предпросмотр PDF
      </Button>
    </Container>
  );
}
