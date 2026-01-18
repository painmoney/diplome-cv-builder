import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert
} from '@mui/material';
import { GitHub } from '@mui/icons-material';

export default function GitHubBlock({ data = [], onChange }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRepos = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
      if (!response.ok) throw new Error('Пользователь не найден');
      const repos = await response.json();
      onChange(repos.map(r => ({ 
        name: r.name, 
        description: r.description, 
        url: r.html_url,
        stars: r.stargazers_count 
      })));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>GitHub Репозитории</Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <Button 
          variant="contained" 
          onClick={fetchRepos}
          disabled={loading}
          startIcon={<GitHub />}
        >
          {loading ? 'Загрузка...' : 'Подключить'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {data.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary">
            Найдено {data.length} репозиториев
          </Typography>
          {data.map((repo, i) => (
            <Box key={i} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
              <Typography variant="body1">{repo.name} ⭐ {repo.stars}</Typography>
              <Typography variant="body2" color="text.secondary">{repo.description}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
