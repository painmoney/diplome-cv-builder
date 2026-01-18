import React from 'react'
import { Container, Typography, Button } from '@mui/material'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <Container sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h3" gutterBottom>
        CV Builder — Создай своё IT-резюме
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Генератор резюме для разработчиков и IT-специалистов. 
        Простой, быстрый, современный.
      </Typography>
      <Button variant="contained" component={Link} to="/register">
        Начать
      </Button>
    </Container>
  )
}
