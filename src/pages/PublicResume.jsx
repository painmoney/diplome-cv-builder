import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";
import TelegramIcon from "@mui/icons-material/Telegram";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
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
          "& > div > div:first-of-type": { pr: "0 !important", display: "flow-root" },
          "& > div > div:first-of-type > img": {
            position: "static", float: "right", width: { xs: 88, sm: 112 }, height: { xs: 88, sm: 112 },
            ml: 2, mb: 1.5, borderRadius: 0, objectPosition: "center 25%",
          },
          "& > div > div:first-of-type > p:last-of-type": { clear: "both", pt: 1 },
        }}>
          <ClassicTemplate data={publicResume} />
        </Box>
        <Stack component="section" aria-labelledby="contact-heading" direction={{ xs: "column", md: "row" }} spacing={2} sx={{
          mt: 2.5, p: { xs: 2.5, sm: 3 }, bgcolor: "#fff", border: "1px solid #dce3eb", borderRadius: 3,
          alignItems: { md: "center" }, justifyContent: "space-between", flexWrap: "wrap", gap: 2,
        }}>
          <Box>
            <Typography id="contact-heading" component="h2" sx={{ fontSize: "1rem", fontWeight: 700 }}>Связаться со мной</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "#52627a" }}>Предпочтительно в Telegram</Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Button component="a" href="https://togliatti.hh.ru/resume/6f0e9286ff114083af0039ed1f4d70414b494a" target="_blank" rel="noopener noreferrer" variant="outlined" sx={{
              color: "#c62828", borderColor: "#efb3b3", "&:hover": { bgcolor: "#fff5f5", borderColor: "#c62828" },
              borderRadius: 2, px: 2, py: 1.25, textTransform: "none", fontWeight: 700,
            }}>Резюме на hh.ru ↗</Button>
            <Button component="a" href="https://t.me/painhood" target="_blank" rel="noopener noreferrer" variant="contained" disableElevation startIcon={<TelegramIcon />} sx={{
              bgcolor: "#087eaf", "&:hover": { bgcolor: "#06658c" }, borderRadius: 2, px: 2, py: 1.25, textTransform: "none",
            }}>Telegram @painhood</Button>
            <Button component="a" href="mailto:prokofievm1@yandex.ru" variant="outlined" startIcon={<MailOutlineIcon />} sx={{
              color: "#24364b", borderColor: "#cbd5e1", "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
              borderRadius: 2, px: 2, py: 1.25, textTransform: "none",
            }}>prokofievm1@yandex.ru</Button>
          </Stack>
        </Stack>
        <Stack component="nav" aria-label="Проекты в портфолио" direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
          {publicResume.projects.flatMap(project => (project.links ?? [{ label: "SauceDemo · Manual QA", url: project.link }]).map(link => <Button key={link.url} component="a" href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</Button>))}
        </Stack>
        <Typography variant="caption" component="p" sx={{ mt: 2, color: "#52627a" }}>Подготовлено в CV Builder</Typography>
      </Container>
    </Box>
  );
}
