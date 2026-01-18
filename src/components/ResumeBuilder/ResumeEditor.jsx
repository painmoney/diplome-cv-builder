// src/components/ResumeBuilder/ResumeEditor.jsx — ПОЛНОСТЬЮ ЗАМЕНИ
import React, { useState, useEffect } from 'react';
import {
  Container, Tabs, Tab, Box, Button, Typography, Alert, TextField
} from '@mui/material';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ProfileForm from '../profile/ProfileForm';
import EducationBlock from './EducationBlock';
import SkillsBlock from './SkillsBlock';
import ExperienceBlock from './ExperienceBlock';
import GitHubBlock from './GitHubBlock';
import TemplateSelector from './TemplateSelector';

export default function ResumeEditor() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [resumeTitle, setResumeTitle] = useState('Моё IT-резюме');
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
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) loadResumeData();
  }, [user]);

  const loadResumeData = async () => {
    console.log('📥 Loading data for user:', user.id);
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('📦 Loaded data:', data);
    
    if (error) {
      console.error('❌ Load error:', error);
      return;
    }
    
    if (data) {
      const loadedData = data.data || {
        profile: { name: '', photo: '', summary: '' },
        education: [],
        skills: [],
        experience: [],
        github: [],
        template: 'minimalist',
        recommendations: []
      };
      console.log('✅ Setting resumeData:', loadedData);
      setResumeData(loadedData);
      setResumeTitle(data.title || 'Моё IT-резюме');
    }
  };

  const updateSection = (section, newData) => {
    console.log(`🔄 Updating ${section}:`, newData);
    setResumeData(prev => {
      const updated = { ...prev, [section]: newData };
      console.log('📝 New resumeData:', updated);
      return updated;
    });
  };

  const saveResume = async () => {
    setLoading(true);
    setMessage('');
    
    console.log('💾 Saving resumeData:', resumeData);
    
    const payload = {
        user_id: user.id,
        title: resumeTitle,
        template: resumeData.template,
        data: resumeData,
        updated_at: new Date().toISOString()
    };
    
    console.log('📤 Payload to save:', payload);
    
    const { error } = await supabase
        .from('resumes')
        .upsert(payload, {
        onConflict: 'user_id'
        });
    
    setLoading(false);
    
    if (error) {
        console.error('❌ Save error:', error);
        setMessage(`Ошибка: ${error.message}`);
    } else {
        console.log('✅ Saved successfully!');
        setMessage('✅ Резюме сохранено!');
        await loadResumeData();
    }
    };

  return (
    <Container sx={{ mt: 4, maxWidth: 1200 }}>
      <Typography variant="h4" gutterBottom>Редактор IT-резюме</Typography>
      
      <TextField
        label="Название резюме"
        value={resumeTitle}
        onChange={(e) => setResumeTitle(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
        placeholder="Моё IT-резюме"
      />

      {message && (
        <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      <TemplateSelector 
        value={resumeData.template}
        onChange={(template) => updateSection('template', template)}
      />
      
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 4 }}>
        <Tab label="Профиль" />
        <Tab label="Навыки" />
        <Tab label="Образование" />
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
          <SkillsBlock 
            data={resumeData.skills}
            onChange={(data) => updateSection('skills', data)}
          />
        )}
        {activeTab === 2 && (
          <EducationBlock 
            data={resumeData.education}
            onChange={(data) => updateSection('education', data)}
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

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button 
          variant="contained" 
          size="large"
          onClick={saveResume}
          disabled={loading}
        >
          {loading ? 'Сохранение...' : '💾 Сохранить резюме'}
        </Button>
        
        <Button 
          variant="outlined" 
          size="large"
          onClick={() => console.log('Current resumeData:', resumeData)}
        >
          🐛 Debug State
        </Button>
      </Box>

      {/* DEBUG панель */}
      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, fontSize: 12 }}>
        <Typography variant="caption">DEBUG:</Typography>
        <pre>{JSON.stringify(resumeData, null, 2)}</pre>
      </Box>
    </Container>
  );
}
