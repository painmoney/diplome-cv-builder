import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";
import ClassicTemplate from "../components/templates/ClassicTemplate";
import { publicResume, publicResumeApproved } from "../data/publicResume";

export default function PublicResume() {
  const isLocalDraft = import.meta.env.DEV;

  if (!publicResumeApproved && !isLocalDraft) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Typography variant="h4" component="h1">Резюме готовится к публикации</Typography>
        <Typography sx={{ mt: 2 }}>Публичная версия появится после согласования содержания.</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef2f6", color: "#142238", py: { xs: 2, sm: 5 } }}>
      <Container maxWidth="md" component="main">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
          <Typography component="h1" variant="body2">Junior QA Engineer · Ручное тестирование</Typography>
          <Button component="a" variant="contained" href="/cv/manual-qa.pdf" download="Matvey_Prokofyev_Junior_QA.pdf">Скачать PDF</Button>
        </Stack>
        {!publicResumeApproved && <Alert severity="info" sx={{ mb: 2 }}>Локальный черновик для согласования. Публикация отключена.</Alert>}
        <Typography variant="body2" sx={{ mb: 2 }}>Тольятти · Постоянная работа · Офис, удалённо или гибрид</Typography>
        <Box sx={{
          bgcolor: "#fff", border: "1px solid #dce3eb", borderRadius: 2,
          "& > *": { width: "100% !important", minHeight: "auto !important", p: { xs: "24px !important", sm: "48px !important" }, borderRadius: 2 },
          "& p, & h4": { overflowWrap: "anywhere" },
        }}>
          <ClassicTemplate data={publicResume} />
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>Предпочитаемый способ связи: <a href="https://t.me/painhood">Telegram @painhood</a> · <a href="mailto:prokofievm1@yandex.ru">prokofievm1@yandex.ru</a></Typography>
        <Stack component="nav" aria-label="Проекты в портфолио" direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
          {publicResume.projects.map(project => <Button key={project.id} component="a" href={project.link} target="_blank" rel="noopener noreferrer">{project.id === "saucedemo" ? "SauceDemo · Manual QA" : "CV Builder · дипломный проект"}</Button>)}
        </Stack>
        <Typography variant="caption" component="p" sx={{ mt: 2, color: "#52627a" }}>Подготовлено в CV Builder</Typography>
      </Container>
    </Box>
  );
}
