import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Collapse,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import DescriptionIcon from "@mui/icons-material/Description";

import { analyzeJobMatch, getKeywordLabel, getKeywordCategory, CATEGORY_LABELS } from "../../utils/jobMatchUtils";
import { isAIAvailable, generateCoverLetter } from "../../utils/aiService";
import EmptyState from "../common/EmptyState";

export default function JobMatchTab({
  resumeData,
  jdText,
  setJdText,
  result,
  setResult,
  error,
  setError,
  isAnalyzing,
  setIsAnalyzing,
  onNavigateToTarget,
}) {
  const [clLoading, setClLoading] = useState(false);
  const [clError, setClError] = useState("");
  const [clPreviewOpen, setClPreviewOpen] = useState(false);
  const [clPreviewText, setClPreviewText] = useState("");
  const handleAnalyze = () => {
    const trimmed = jdText.trim();
    if (!trimmed || trimmed.split(/\s+/).length < 5) return;

    setIsAnalyzing(true);
    setError("");

    setTimeout(() => {
      try {
        const matchResult = analyzeJobMatch(resumeData, jdText);
        setResult(matchResult);
      } catch {
        setError("Произошла ошибка при анализе. Попробуйте ещё раз.");
      } finally {
        setIsAnalyzing(false);
      }
    }, 150);
  };

  const handleTextChange = (e) => {
    setJdText(e.target.value);
    setResult(null);
    setError("");
  };

  const handleGenerateCoverLetter = async () => {
    setClLoading(true);
    setClError("");
    try {
      const text = await generateCoverLetter({
        jdText,
        name: resumeData.profile?.name || "",
        about: resumeData.profile?.about || resumeData.profile?.summary || "",
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        found: result?.found || [],
        missing: result?.missingTechnical || [],
        companyName: result?.companyName || "",
        positionName: result?.positionName || "",
      });
      setClPreviewText(text);
      setClPreviewOpen(true);
    } catch (err) {
      setClError(err.message || "Ошибка AI-сервиса");
    } finally {
      setClLoading(false);
    }
  };

  const handleCopyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(clPreviewText);
    } catch {
      // fallback: select text in textarea
    }
  };

  const handleDownloadCoverLetter = () => {
    const blob = new Blob([clPreviewText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = jdText.trim() ? jdText.trim().split(/\s+/).length : 0;
  const canAnalyze = wordCount >= 5 && !isAnalyzing;

  const hasIncompleteResume =
    (resumeData.skills || []).length < 3 ||
    (resumeData.experience || []).length === 0 ||
    !(resumeData.profile?.about || resumeData.profile?.summary || "").trim();

  const scoreColor = (pct) => {
    if (pct >= 70) return "success";
    if (pct >= 40) return "warning";
    return "error";
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Анализ соответствия вакансии
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Вставьте текст вакансии, чтобы узнать, насколько ваше резюме ей соответствует.
        Анализ работает лучше с английскими вакансиями, но технологические термины
        (React, Docker, PostgreSQL и т.д.) распознаются в любом языке.
      </Typography>

      <TextField
        id="job-match-input"
        label="Текст вакансии"
        multiline
        minRows={4}
        maxRows={12}
        fullWidth
        value={jdText}
        onChange={handleTextChange}
        placeholder="Вставьте текст вакансии сюда..."
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleAnalyze}
        disabled={!canAnalyze}
        sx={{ mb: 3 }}
      >
        {isAnalyzing ? "Анализ..." : "Анализировать"}
      </Button>

      {wordCount > 0 && wordCount < 10 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Текст вакансии слишком короткий ({wordCount} слов). Для точного анализа
          вставьте полный текст описания позиции.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Collapse in timeout={300}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Техническое совпадение
                </Typography>
                <Chip
                  size="small"
                  label={`${result.technicalScore}%`}
                  color={scoreColor(result.technicalScore)}
                  variant="filled"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={result.technicalScore}
                sx={{
                  height: 12,
                  borderRadius: 999,
                  bgcolor: "action.hover",
                  mb: 1,
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    bgcolor: scoreColor(result.technicalScore) + ".main",
                  },
                }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  {result.technicalMatched} из {result.technicalTotal} технических ключевых слов
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Общее совпадение: {result.overallScore}%
                </Typography>
              </Box>
              {result.hasLowConfidence && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Результаты могут быть неточными из-за короткого текста вакансии.
                </Alert>
              )}
            </CardContent>
          </Card>

          {result.totalKeywords === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              В тексте вакансии не найдены технические ключевые слова. Попробуйте
              вставить более детальное описание позиции с перечислением технологий.
            </Alert>
          )}

          {result.totalKeywords > 0 && result.found.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Найденные ключевые слова ({result.found.length})
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {result.found.map((kw) => (
                    <Tooltip key={kw} title={`Категория: ${getKeywordCategory(kw) || "Неизвестно"}`}>
                      <Chip label={getKeywordLabel(kw)} color="success" variant="outlined" size="small" />
                    </Tooltip>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && result.missingTechnical.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Отсутствующие ключевые слова ({result.missingTechnical.length})
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {result.missingTechnical.map((kw) => (
                    <Tooltip key={kw} title={`Категория: ${getKeywordCategory(kw) || "Неизвестно"}`}>
                      <Chip label={getKeywordLabel(kw)} color="error" variant="filled" size="small" />
                    </Tooltip>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && Object.keys(result.categoryBreakdown).length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Разбивка по категориям
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(result.categoryBreakdown).map(([cat, data]) => (
                    <Box key={cat}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2">
                          {CATEGORY_LABELS[cat] || cat}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {data.matched}/{data.total} ({data.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={data.percentage}
                        sx={{
                          height: 6,
                          borderRadius: 999,
                          bgcolor: "action.hover",
                          "& .MuiLinearProgress-bar": { borderRadius: 999 },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && result.recommendations.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Рекомендации
                </Typography>
                <Stack spacing={1}>
                  {result.recommendations.map((rec, idx) => (
                    <Alert
                      key={idx}
                      severity="info"
                      action={
                        <Button
                          size="small"
                          onClick={() => onNavigateToTarget(rec.tab, rec.target)}
                        >
                          Перейти
                        </Button>
                      }
                    >
                      {rec.text}
                    </Alert>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && isAIAvailable() && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <DescriptionIcon fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    AI Сопроводительное письмо
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  Перед генерацией заполните навыки, опыт и блок «О себе».
                  AI использует только данные из резюме и текст вакансии.
                  Если технология не указана в резюме, она может быть определена как зона развития.
                </Alert>
                {hasIncompleteResume && (
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    Резюме заполнено не полностью — письмо может получиться неточным.
                  </Alert>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleGenerateCoverLetter}
                  disabled={clLoading}
                  startIcon={clLoading ? <CircularProgress size={16} /> : <DescriptionIcon />}
                >
                  {clLoading ? "Генерация..." : "Сгенерировать письмо"}
                </Button>
                {clError && (
                  <Alert severity="warning" sx={{ mt: 1.5 }} onClose={() => setClError("")}>
                    {clError}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Collapse>
      )}

      {!result && !isAnalyzing && (
        <EmptyState
          icon={<WorkIcon sx={{ fontSize: 40 }} />}
          title="Анализ соответствия вакансии"
          description="Вставьте текст вакансии и нажмите «Анализировать», чтобы узнать, насколько ваше резюме соответствует требованиям"
          compact
        />
      )}

      <Dialog
        open={clPreviewOpen}
        onClose={() => setClPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Сопроводительное письмо</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Проверьте текст. Письмо можно скопировать или скачать.
          </Alert>
          <TextField
            multiline
            fullWidth
            minRows={8}
            maxRows={20}
            value={clPreviewText}
            onChange={(e) => setClPreviewText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownloadCoverLetter}>Скачать .txt</Button>
          <Button onClick={handleCopyCoverLetter}>Копировать</Button>
          <Button onClick={() => setClPreviewOpen(false)} variant="contained">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
