import { useState, lazy, Suspense } from "react";
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
  Popover,
  Divider,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import DescriptionIcon from "@mui/icons-material/Description";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { analyzeJobMatch, getKeywordLabel, getKeywordCategory, CATEGORY_LABELS } from "../../utils/jobMatchUtils";
import { isAIAvailable, generateCoverLetter, generateJobMatchAdvice } from "../../utils/aiService";
import { getCoverLetterMode, buildSafeNextActions, buildApplicationReadiness, buildDeclaredSkillTip } from "../../utils/coverLetterSafetyUtils";
import EmptyState from "../common/EmptyState";
import AiConsentDialog from "../common/AiConsentDialog";
import { useAiConsent } from "../../hooks/useAiConsent";

const DevScenarioPanel = import.meta.env.DEV
  ? lazy(() => import("../dev/JobMatchScenarioPanel"))
  : null;

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
  onLoadDevScenario,
}) {
  const { open: aiConsentOpen, requestAiAction, handleConfirm: aiConsentConfirm, handleDismiss: aiConsentDismiss } = useAiConsent();
  const [clLoading, setClLoading] = useState(false);
  const [clError, setClError] = useState("");
  const [clPreviewOpen, setClPreviewOpen] = useState(false);
  const [clPreviewText, setClPreviewText] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");
  const [advicePreviewOpen, setAdvicePreviewOpen] = useState(false);
  const [advicePreviewText, setAdvicePreviewText] = useState("");
  const [declaredTipAnchorEl, setDeclaredTipAnchorEl] = useState(null);
  const [selectedDeclaredSkill, setSelectedDeclaredSkill] = useState(null);

  const coverLetterMode = getCoverLetterMode({
    evidenceScore: result?.evidenceScore,
    technicalScore: result?.technicalScore,
    confirmedExperience: result?.confirmedExperience || [],
    confirmedProjects: result?.confirmedProjects || [],
    declaredOnly: result?.declaredOnly || [],
    missingEvidence: result?.missingEvidence || [],
  });

  const isWeakCoverLetterMatch = coverLetterMode.mode === "careful";
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
        confirmedExperience: result?.confirmedExperience || [],
        confirmedProjects: result?.confirmedProjects || [],
        declaredOnly: result?.declaredOnly || [],
        missingEvidence: result?.missingEvidence || [],
        evidenceScore: result?.evidenceScore,
        technicalScore: result?.technicalScore,
        overallScore: result?.overallScore,
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

  const handleGenerateAdvice = async () => {
    setAdviceLoading(true);
    setAdviceError("");
    try {
      const text = await generateJobMatchAdvice({
        jdText,
        confirmedExperience: result?.confirmedExperience || [],
        confirmedProjects: result?.confirmedProjects || [],
        declaredOnly: result?.declaredOnly || [],
        missingEvidence: result?.missingEvidence || [],
        evidenceScore: result?.evidenceScore,
        technicalScore: result?.technicalScore,
        overallScore: result?.overallScore,
      });
      setAdvicePreviewText(text);
      setAdvicePreviewOpen(true);
    } catch (err) {
      setAdviceError(err.message || "Ошибка AI-сервиса");
    } finally {
      setAdviceLoading(false);
    }
  };

  const handleCopyAdvice = async () => {
    try {
      await navigator.clipboard.writeText(advicePreviewText);
    } catch {
      // no-op fallback
    }
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
      {DevScenarioPanel && onLoadDevScenario && (
        <Suspense fallback={null}>
          <DevScenarioPanel onLoadDevScenario={onLoadDevScenario} />
        </Suspense>
      )}

      <Typography variant="h6" gutterBottom>
        Анализ соответствия вакансии
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Вставьте полный текст вакансии — так анализ будет точнее.
        Мы сравним требования вакансии с опытом, проектами и навыками в резюме.
        CV Builder не будет выдавать неподтверждённые навыки за опыт.
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
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Показывает, сколько технологий и требований вакансии найдено в резюме.
              </Typography>
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

          {result.totalKeywords > 0 && result.evidenceScore !== undefined && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Оценка доказательной базы
                  </Typography>
                  <Chip
                    size="small"
                    label={`${result.evidenceScore}%`}
                    color={scoreColor(result.evidenceScore)}
                    variant="filled"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Показывает, насколько навыки из вакансии подтверждены опытом, проектами или GitHub.
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={result.evidenceScore}
                  sx={{
                    height: 12,
                    borderRadius: 999,
                    bgcolor: "action.hover",
                    mb: 1,
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 999,
                      bgcolor: scoreColor(result.evidenceScore) + ".main",
                    },
                  }}
                />
                <Alert severity="info" sx={{ mt: 1 }}>
                  CV Builder не рекомендует добавлять навыки только ради совпадения с вакансией.
                  Если требование найдено только в вакансии, добавляйте его в резюме только при наличии реального опыта.
                </Alert>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && result.confirmedExperience?.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Подтверждено опытом ({result.confirmedExperience.length})
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {result.confirmedExperience.map((kw) => (
                    <Tooltip key={kw} title={`Категория: ${getKeywordCategory(kw) || "Неизвестно"}`}>
                      <Chip label={getKeywordLabel(kw)} color="success" variant="filled" size="small" />
                    </Tooltip>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && result.confirmedProjects?.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Подтверждено проектами / GitHub ({result.confirmedProjects.length})
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {result.confirmedProjects.map((kw) => (
                    <Tooltip key={kw} title={`Категория: ${getKeywordCategory(kw) || "Неизвестно"}`}>
                      <Chip label={getKeywordLabel(kw)} color="info" variant="outlined" size="small" />
                    </Tooltip>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && result.declaredOnly?.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Есть только в навыках ({result.declaredOnly.length})
                </Typography>
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  Эти технологии указаны в навыках, но пока не подтверждены опытом или проектами. Нажмите на навык, чтобы узнать, как безопасно подтвердить его без выдумывания опыта.
                </Alert>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {result.declaredOnly.map((kw) => (
                    <Chip
                      key={kw}
                      label={getKeywordLabel(kw)}
                      color="warning"
                      variant="outlined"
                      size="small"
                      icon={<HelpOutlineIcon />}
                      onClick={(e) => {
                        setDeclaredTipAnchorEl(e.currentTarget);
                        setSelectedDeclaredSkill(kw);
                      }}
                      sx={{ cursor: "pointer" }}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && result.missingEvidence?.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Отсутствует в резюме ({result.missingEvidence.length})
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {result.missingEvidence.map((kw) => (
                    <Tooltip key={kw} title={`Категория: ${getKeywordCategory(kw) || "Неизвестно"}`}>
                      <Chip label={getKeywordLabel(kw)} color="error" variant="outlined" size="small" />
                    </Tooltip>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && result.unsafeToAdd?.length > 0 && (() => {
            const shown = result.unsafeToAdd.slice(0, 5);
            const names = shown.map(getKeywordLabel).join(", ");
            const extra = result.unsafeToAdd.length > 5 ? ` и ещё ${result.unsafeToAdd.length - 5}` : "";
            const isPlural = shown.length > 1;
            const foundWord = isPlural ? "найдены" : "найден";
            const skillWord = isPlural ? "навыки" : "навык";
            return (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {`Не добавляйте без опыта: ${names}${extra} не ${foundWord} в резюме. Добавляйте ${skillWord} только при наличии реального опыта.`}
              </Alert>
            );
          })()}

          {/* Fallback: show legacy found/missing if evidence data not available */}
          {result.evidenceScore === undefined && result.totalKeywords > 0 && result.found.length > 0 && (
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

          {result.evidenceScore === undefined && result.totalKeywords > 0 && result.missingTechnical.length > 0 && (
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
                  {result.recommendations.map((rec, idx) => {
                    const severity =
                      rec.type === "evidence_confirmed" ? "success" :
                      rec.type === "evidence_declared" ? "warning" :
                      rec.type === "evidence_missing" ? "error" :
                      "info";
                    const showNav = rec.tab >= 0 && rec.target;
                    return (
                      <Alert
                        key={idx}
                        severity={severity}
                        action={
                          showNav ? (
                            <Button
                              size="small"
                              onClick={() => onNavigateToTarget(rec.tab, rec.target)}
                            >
                              Перейти
                            </Button>
                          ) : undefined
                        }
                      >
                        {rec.text}
                      </Alert>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && (() => {
            const coverMode = getCoverLetterMode({
              evidenceScore: result.evidenceScore,
              technicalScore: result.technicalScore,
              confirmedExperience: result.confirmedExperience || [],
              confirmedProjects: result.confirmedProjects || [],
              declaredOnly: result.declaredOnly || [],
              missingEvidence: result.missingEvidence || [],
            });
            const readiness = buildApplicationReadiness({
              technicalScore: result.technicalScore,
              evidenceScore: result.evidenceScore,
              mode: coverMode.mode,
              declaredOnly: result.declaredOnly || [],
            });
            const nextActions = buildSafeNextActions({
              confirmedExperience: result.confirmedExperience || [],
              confirmedProjects: result.confirmedProjects || [],
              declaredOnly: result.declaredOnly || [],
              missingEvidence: result.missingEvidence || [],
              evidenceScore: result.evidenceScore,
            });

            return (
              <>
                {/* Application Readiness */}
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Готовность к отклику
                      </Typography>
                      <Chip
                        size="small"
                        label={readiness.label}
                        color={readiness.color}
                        variant="filled"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      Помогает понять, можно ли уже откликаться или лучше сначала усилить резюме.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {readiness.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                      <Chip
                        size="small"
                        label={`Техническое совпадение: ${result.technicalScore}%`}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`Доказательная база: ${result.evidenceScore}%`}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={coverMode.mode === "ai" ? "Письмо: стандартное" : "Письмо: осторожное"}
                        variant="outlined"
                      />
                    </Stack>
                  </CardContent>
                </Card>

                {/* Why careful cover letter */}
                {coverMode.mode === "careful" && (
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Почему письмо осторожное
                      </Typography>
                      <Stack spacing={1}>
                        <Alert severity="info">
                          CV Builder не преувеличивает опыт кандидата. Осторожный режим — осознанная защита от рискованных формулировок в сопроводительном письме.
                        </Alert>
                        {(result.declaredOnly || []).length > 0 && (
                          <Alert severity="info">
                            Технологии из «Только в навыках» считаются заявленными навыками, но не доказанным опытом. Они не попадут в письмо как опыт.
                          </Alert>
                        )}
                        {(result.missingEvidence || []).length > 0 && (
                          <Alert severity="info">
                            Технологии, отсутствующие в резюме, не будут добавлены в письмо. Позиция может быть смежной с вашим текущим профилем, поэтому письмо делает акцент на подтверждённых сильных сторонах.
                          </Alert>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Safe next actions */}
                {nextActions.length > 0 && (
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Что можно безопасно усилить
                      </Typography>
                      <Stack spacing={1}>
                        {nextActions.map((action, idx) => (
                          <Alert key={idx} severity={action.type}>
                            {action.text}
                          </Alert>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </>
            );
          })()}

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
                </Alert>
                {isWeakCoverLetterMatch && (
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    Совпадение с вакансией низкое или слабо подтверждено опытом. CV Builder сформирует осторожную версию письма без упоминания неподтверждённых технологий.
                  </Alert>
                )}
                {hasIncompleteResume && (
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    Резюме заполнено не полностью — письмо может получиться неточным.
                  </Alert>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => requestAiAction(handleGenerateCoverLetter)}
                  disabled={clLoading}
                  startIcon={clLoading ? <CircularProgress size={16} /> : <DescriptionIcon />}
                >
                  {clLoading ? "Генерация..." : isWeakCoverLetterMatch ? "Сформировать осторожное письмо" : "Сгенерировать письмо"}
                </Button>
                {clError && (
                  <Alert severity="warning" sx={{ mt: 1.5 }} onClose={() => setClError("")}>
                    {clError}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {result.totalKeywords > 0 && isAIAvailable() && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <WorkIcon fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    AI Рекомендации под вакансию
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  AI проанализирует соответствие резюме вакансии и даст безопасные рекомендации. Рекомендации не изменят резюме автоматически.
                </Alert>
                {result.evidenceScore !== undefined && result.evidenceScore < 40 && (
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    Оценка доказательной базы ниже 40% — вакансия слабо подтверждается резюме. Не адаптируйте резюме искусственно.
                  </Alert>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => requestAiAction(handleGenerateAdvice)}
                  disabled={adviceLoading}
                  startIcon={adviceLoading ? <CircularProgress size={16} /> : <WorkIcon />}
                >
                  {adviceLoading ? "Генерация..." : "AI-рекомендации под вакансию"}
                </Button>
                {adviceError && (
                  <Alert severity="warning" sx={{ mt: 1.5 }} onClose={() => setAdviceError("")}>
                    {adviceError}
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
        <DialogTitle>{isWeakCoverLetterMatch ? "Сопроводительное письмо (осторожная версия)" : "Сопроводительное письмо"}</DialogTitle>
        <DialogContent>
          {isWeakCoverLetterMatch ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Это осторожная версия письма: часть требований вакансии не подтверждена опытом или проектами, поэтому неподтверждённые технологии не добавлены.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              Проверьте текст. Письмо можно скопировать или скачать.
            </Alert>
          )}
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

      <Dialog
        open={advicePreviewOpen}
        onClose={() => setAdvicePreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>AI Рекомендации под вакансию</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Рекомендации основаны на анализе резюме и текста вакансии. Проверьте каждый пункт перед применением.
          </Alert>
          <TextField
            multiline
            fullWidth
            minRows={8}
            maxRows={20}
            value={advicePreviewText}
            onChange={(e) => setAdvicePreviewText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopyAdvice}>Копировать</Button>
          <Button onClick={() => setAdvicePreviewOpen(false)} variant="contained">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Declared-skill tip Popover */}
      <Popover
        open={Boolean(declaredTipAnchorEl)}
        anchorEl={declaredTipAnchorEl}
        onClose={() => {
          setDeclaredTipAnchorEl(null);
          setSelectedDeclaredSkill(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: 420,
              p: 2.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
      >
        {selectedDeclaredSkill && (() => {
          const tip = buildDeclaredSkillTip(selectedDeclaredSkill);
          return (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {tip.title}
              </Typography>

              <Alert severity="info" sx={{ mb: 1.5 }}>
                {tip.description}
              </Alert>

              <Typography variant="caption" sx={{ fontWeight: 600, color: "success.main" }}>
                Как безопасно подтвердить
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 1.5, mt: 0.5 }}>
                {tip.safeActions.map((action, i) => (
                  <Typography key={i} variant="body2" sx={{ pl: 1.5, position: "relative" }}>
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                      }}
                    />
                    {action}
                  </Typography>
                ))}
              </Stack>

              <Typography variant="caption" sx={{ fontWeight: 600, color: "error.main" }}>
                Чего не писать
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 1.5, mt: 0.5 }}>
                {tip.avoid.map((item, i) => (
                  <Typography key={i} variant="body2" color="text.secondary" sx={{ pl: 1.5, position: "relative" }}>
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "error.main",
                      }}
                    />
                    {item}
                  </Typography>
                ))}
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                Где подтвердить навык
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                {tip.targetSuggestions.map((s) => (
                  <Button
                    key={s.tab}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setDeclaredTipAnchorEl(null);
                      setSelectedDeclaredSkill(null);
                      onNavigateToTarget(s.tab, s.targetId);
                    }}
                    sx={{ textTransform: "none" }}
                  >
                    {s.label}
                  </Button>
                ))}
              </Stack>
            </>
          );
        })()}
      </Popover>

      <AiConsentDialog open={aiConsentOpen} onConfirm={aiConsentConfirm} onDismiss={aiConsentDismiss} />
    </Box>
  );
}
