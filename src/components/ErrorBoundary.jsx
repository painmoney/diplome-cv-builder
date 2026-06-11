import { Component } from "react";
import { Box, Typography, Button } from "@mui/material";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Что-то пошло не так
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Перезагрузить
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
