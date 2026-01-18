import React, { useEffect, useState, useMemo } from "react";
import { Container, Box, Button, Typography, CircularProgress, Snackbar, Alert } from "@mui/material";
import { Edit, GetApp, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabaseClient";
import MinimalistTemplate from "../components/templates/MinimalistTemplate";
import AcademicTemplate from "../components/templates/AcademicTemplate";
import GithubTemplate from "../components/templates/GithubTemplate";
import { exportToPDF } from "../components/export/ExportPDF";

export default function ResumePreview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      loadResume();
    }
  }, [user]);

  const loadResume = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setResume(data);
    }
    setLoading(false);
  };

  const handleExportPDF = async () => {
    if (!resume) return;
    setExporting(true);
    try {
      const result = await exportToPDF(resume.data, resume.template);
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? 'success' : 'error'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Ошибка при экспорте PDF',
        severity: 'error'
      });
    } finally {
      setExporting(false);
    }
  };

  const TemplateComponent = useMemo(() => {
    if (!resume?.data) return null;

    switch (resume.template) {
      case 'academic':
        return <AcademicTemplate data={resume.data} />;
      case 'github':
        return <GithubTemplate data={resume.data} />;
      case 'minimalist':
      default:
        return <MinimalistTemplate data={resume.data} />;
    }
  }, [resume]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!resume) {
    return (
      <Container sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5" gutterBottom>
          Резюме не найдено
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/resume-editor')}
          sx={{ mt: 2 }}
        >
          Создать резюме
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Панель управления */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Button 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          disabled={exporting}
        >
          Назад
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Edit />}
            onClick={() => navigate('/resume-editor')}
            disabled={exporting}
          >
            Редактировать
          </Button>
          <Button 
            variant="contained" 
            startIcon={<GetApp />}
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? 'Экспорт...' : 'Скачать PDF'}
          </Button>
        </Box>
      </Box>

      {/* Превью резюме */}
      <Box sx={{ 
        bgcolor: '#f5f5f5',
        p: 4,
        borderRadius: 2,
        display: 'flex',
        justifyContent: 'center'
      }}>
        {TemplateComponent}
      </Box>

      {/* Информация о шаблоне */}
      <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="caption">
          Шаблон: {resume.template} | Последнее изменение: {new Date(resume.updated_at).toLocaleString('ru-RU')}
        </Typography>
      </Box>

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
