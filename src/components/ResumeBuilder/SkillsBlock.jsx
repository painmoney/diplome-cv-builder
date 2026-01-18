import React, { useState } from 'react';
import {
  Box, TextField, Button, Chip, IconButton, Typography
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

export default function SkillsBlock({ data = [], onChange }) {
  const [newSkill, setNewSkill] = useState('');
  const [level, setLevel] = useState(3);

  const addSkill = () => {
    if (newSkill.trim()) {
      const skill = { name: newSkill, level: parseInt(level), id: Date.now() };
      onChange([...data, skill]);
      setNewSkill('');
      setLevel(3);
    }
  };

  const removeSkill = (id) => {
    onChange(data.filter(skill => skill.id !== id));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Навыки</Typography>
      
      {/* Добавление навыка */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Навык"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <TextField
          label="Уровень (1-5)"
          type="number"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          inputProps={{ min: 1, max: 5 }}
          size="small"
          sx={{ width: 120 }}
        />
        <Button 
          variant="contained" 
          onClick={addSkill}
          startIcon={<Add />}
          size="small"
        >
          Добавить
        </Button>
      </Box>

      {/* Список навыков */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {data.map((skill) => (
          <Chip
            key={skill.id}
            label={`${skill.name} (${skill.level}/5)`}
            color="primary"
            onDelete={() => removeSkill(skill.id)}
            deleteIcon={<Delete fontSize="small" />}
          />
        ))}
      </Box>
    </Box>
  );
}
