import { useState } from "react";
import { Alert, Button, Stack, Typography, Chip, Box, Collapse } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { JOB_MATCH_TEST_CASES } from "../../dev/jobMatchTestCases";

export default function JobMatchScenarioPanel({ onLoadDevScenario }) {
  const [selectedCase, setSelectedCase] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const handleLoad = (testCase) => {
    const ok = window.confirm(
      `Загрузка сценария «${testCase.title}» заменит текущие данные резюме и текст вакансии.`
    );
    if (!ok) return;

    onLoadDevScenario({
      resumeData: testCase.resumeData,
      jobText: testCase.jobText,
    });

    setSelectedCase(testCase.id);
  };

  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        Dev scenarios
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Подставляют тестовые данные для проверки Job Match и Cover Letter.
      </Typography>

      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
        {JOB_MATCH_TEST_CASES.map((tc) => (
          <Box key={tc.id}>
            <Button
              size="small"
              variant={selectedCase === tc.id ? "contained" : "outlined"}
              onClick={() => handleLoad(tc)}
              sx={{ textTransform: "none", fontSize: "0.75rem" }}
            >
              {tc.title.split("—")[0].trim()}
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={() => setExpanded(expanded === tc.id ? null : tc.id)}
              sx={{ minWidth: 0, p: 0.25 }}
            >
              {expanded === tc.id ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </Button>
          </Box>
        ))}
      </Stack>

      {JOB_MATCH_TEST_CASES.map((tc) => (
        <Collapse key={tc.id} in={expanded === tc.id}>
          <Box sx={{ mt: 1, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
              {tc.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {tc.description}
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5, mb: 0.5 }}>
              <Chip size="small" label={`mode: ${tc.expectedMode}`} color={tc.expectedMode === "careful" ? "warning" : "success"} variant="outlined" />
            </Stack>
            {tc.expected.map((e) => (
              <Typography key={e} variant="caption" color="text.secondary" sx={{ display: "block" }}>
                • {e}
              </Typography>
            ))}
          </Box>
        </Collapse>
      ))}
    </Alert>
  );
}
