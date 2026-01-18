import React, { useState } from 'react';
import {
  Box, TextField, Button, Card, CardContent, IconButton, Typography
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

export default function ExperienceBlock({ data = [], onChange }) {
  const [newExp, setNewExp] = useState({
    company: '', position: '', period: '', description: ''
  });

  const addExperience = () => {
    if (newExp.company.trim()) {
      const exp = { ...newExp, id: Date.now() };
      onChange([...data, exp]);
      setNewExp({ company: '', position: '', period: '', description: '' });
    }
  };

  const removeExperience = (id) => {
    onChange(data.filter(item => item.id !== id));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Опыт работы</Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Компания"
            value={newExp.company}
            onChange={(e) => setNewExp({...newExp, company: e.target.value})}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Должность"
            value={newExp.position}
            onChange={(e) => setNewExp({...newExp, position: e.target.value})}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Период"
            value={newExp.period}
            placeholder="2022-2024"
            onChange={(e) => setNewExp({...newExp, period: e.target.value})}
            size="small"
            sx={{ minWidth: 150 }}
          />
        </Box>
        <TextField
          label="Описание (проекты, достижения)"
          value={newExp.description}
          onChange={(e) => setNewExp({...newExp, description: e.target.value})}
          multiline
          rows={2}
          size="small"
        />
        <Button 
          variant="contained" 
          onClick={addExperience}
          startIcon={<Add />}
          sx={{ alignSelf: 'flex-start' }}
        >
          Добавить опыт
        </Button>
      </Box>

      {data.map((exp) => (
        <Card key={exp.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle1">{exp.position} • {exp.company}</Typography>
                <Typography variant="body2" color="text.secondary">{exp.period}</Typography>
                {exp.description && <Typography variant="body2" sx={{ mt: 1 }}>{exp.description}</Typography>}
              </Box>
              <IconButton onClick={() => removeExperience(exp.id)} size="small">
                <Delete />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
