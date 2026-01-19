import React from "react";
import { Box, Typography, Alert, Chip } from "@mui/material";

const colorByType = (type) => {
  switch (type) {
    case "profile":
      return "info";
    case "skills":
      return "primary";
    case "experience":
      return "warning";
    case "education":
      return "success";
    case "github":
      return "secondary";
    default:
      return "info";
  }
};

export default function RecommendationPanel({ recommendations = [] }) {
  if (!recommendations.length) {
    return (
      <Alert severity="success" sx={{ mb: 3 }}>
        ✅ Рекомендации: всё выглядит хорошо. Можно экспортировать резюме.
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Рекомендации по улучшению
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {recommendations.map((r, idx) => (
          <Alert key={idx} severity={colorByType(r.type)} icon={false}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip size="small" label={r.type} />
              <Typography variant="body2">{r.text}</Typography>
            </Box>
          </Alert>
        ))}
      </Box>
    </Box>
  );
}
