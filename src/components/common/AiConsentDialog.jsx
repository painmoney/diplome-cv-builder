import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

export default function AiConsentDialog({ open, onConfirm, onDismiss }) {
  return (
    <Dialog open={open} onClose={onDismiss} maxWidth="sm" fullWidth>
      <DialogTitle>AI-функция</DialogTitle>
      <DialogContent>
        <DialogContentText>
          При использовании AI-функции текст вашего резюме или вакансии будет
          передан на сервер Puter для обработки моделью GPT-4o-mini (OpenAI).
          Данные не сохраняются на наших серверах, но передаются провайдеру AI-модели.
        </DialogContentText>
        <DialogContentText sx={{ mt: 1 }}>
          Результат генерируется автоматически и требует вашей проверки перед
          сохранением.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDismiss}>Отмена</Button>
        <Button onClick={onConfirm} variant="contained">
          Продолжить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
