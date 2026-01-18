import React, { useEffect, useState } from "react";
import { 
  Container, Typography, Button, Box, Card, CardContent, 
  Avatar, Grid, Chip, Snackbar, Alert 
} from "@mui/material";
import { Edit, Visibility, GetApp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabaseClient";
import { getAvatarUrl } from "../api/storage";
import { exportToPDF } from "../components/export/ExportPDF.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      loadResume();
      setAvatarUrl(getAvatarUrl(user.id));
    }
  }, [user]);

  const loadResume = async () => {
    const { data } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) setResume(data);
  };

  const handleExportPDF = async () => {
    if (!resume) {
      setSnackbar({ open: true, message: 'Сначала создайте резюме', severity: 'warning' });
      return;
    }
    const result = await exportToPDF(resume.data, resume.template);
    setSnackbar({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    });
  };

  return (
    <Container sx={{ mt: 4, maxWidth: 900 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Avatar src={avatarUrl} sx={{ width: 80, height: 80 }}>
          {resume?.data?.profile?.name?.[0] || user.email[0].toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h4">
            {resume?.data?.profile?.name || 'Добро пожаловать!'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      </Box>

      {/* Карточка резюме */}
      {resume ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{resume.title}</Typography>
              <Chip 
                label={`Шаблон: ${resume.template}`} 
                color="primary" 
                size="small" 
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Обновлено: {new Date(resume.updated_at).toLocaleDateString('ru-RU')}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Навыки</Typography>
                <Typography variant="h6">{resume.data?.skills?.length || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Образование</Typography>
                <Typography variant="h6">{resume.data?.education?.length || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Опыт</Typography>
                <Typography variant="h6">{resume.data?.experience?.length || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">GitHub</Typography>
                <Typography variant="h6">{resume.data?.github?.length || 0}</Typography>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                startIcon={<Edit />}
                onClick={() => navigate('/resume-editor')}
              >
                Редактировать
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Visibility />}
                onClick={() => navigate('/resume-preview')}
              >
                Просмотр
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<GetApp />}
                onClick={handleExportPDF}
              >
                Скачать PDF
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3, textAlign: 'center', p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Резюме ещё не создано
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Создайте своё первое IT-резюме прямо сейчас
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/resume-editor')}
          >
            Создать резюме
          </Button>
        </Card>
      )}

      {/* Быстрые действия */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Быстрые действия
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }} onClick={() => navigate('/resume-editor')}>
            <CardContent>
              <Edit color="primary" sx={{ mb: 1 }} />
              <Typography variant="h6">Редактор резюме</Typography>
              <Typography variant="body2" color="text.secondary">
                Добавьте навыки, опыт и проекты
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }} onClick={handleExportPDF}>
            <CardContent>
              <GetApp color="primary" sx={{ mb: 1 }} />
              <Typography variant="h6">Экспорт в PDF</Typography>
              <Typography variant="body2" color="text.secondary">
                Скачайте готовое резюме
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
