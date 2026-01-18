import React, { useState } from 'react';
import {
  Box, TextField, Button, Card, CardContent, IconButton, Typography
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

export default function EducationBlock({ data = [], onChange }) {
  const [newEdu, setNewEdu] = useState({
    institution: '', degree: '', years: ''
  });

  const addEducation = () => {
    if (newEdu.institution.trim()) {
      const edu = { ...newEdu, id: Date.now() };
      onChange([...data, edu]);
      setNewEdu({ institution: '', degree: '', years: '' });
    }
  };

  const removeEducation = (id) => {
    onChange(data.filter(item => item.id !== id));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Образование</Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="ВУЗ/курс"
          value={newEdu.institution}
          onChange={(e) => setNewEdu({...newEdu, institution: e.target.value})}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          label="Степень/сертификат"
          value={newEdu.degree}
          onChange={(e) => setNewEdu({...newEdu, degree: e.target.value})}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Годы"
          value={newEdu.years}
          placeholder="2020-2024"
          onChange={(e) => setNewEdu({...newEdu, years: e.target.value})}
          size="small"
          sx={{ minWidth: 120 }}
        />
        <Button 
          variant="contained" 
          onClick={addEducation}
          startIcon={<Add />}
          size="small"
        >
          Добавить
        </Button>
      </Box>

      {data.map((edu) => (
        <Card key={edu.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1">{edu.institution}</Typography>
                <Typography variant="body2">{edu.degree} ({edu.years})</Typography>
              </Box>
              <IconButton onClick={() => removeEducation(edu.id)} size="small">
                <Delete />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
