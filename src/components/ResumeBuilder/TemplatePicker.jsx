import { useState, useRef, useCallback } from "react";
import {
  Button,
  Popover,
  Box,
  Typography,
  Chip,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ExpandMore, CheckCircle, Close } from "@mui/icons-material";
import { TEMPLATE_REGISTRY, getSafeTemplateId } from "../../utils/templateRegistry";

const THUMBNAIL_COLORS = {
  minimalist: { bg: "#f8fafc", border: "#e2e8f0", accent: "#1976D2" },
  academic: { bg: "#f1f8e9", border: "#c5e1a5", accent: "#2E7D32" },
  github: { bg: "#0d1117", border: "#30363d", accent: "#0969DA" },
  classic: { bg: "#ffffff", border: "#bdbdbd", accent: "#333333" },
  modern: { bg: "#f0f9ff", border: "#bae6fd", accent: "#0ea5e9" },
};

function TemplateThumbnail({ templateId, selected }) {
  const colors = THUMBNAIL_COLORS[templateId] || THUMBNAIL_COLORS.minimalist;
  return (
    <Box
      sx={{
        width: 80,
        height: 100,
        borderRadius: 1,
        border: "2px solid",
        borderColor: selected ? "primary.main" : colors.border,
        bgcolor: colors.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Box sx={{ height: 12, bgcolor: colors.accent, opacity: 0.8 }} />
      <Box sx={{ flex: 1, p: 0.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
        <Box sx={{ height: 3, width: "60%", bgcolor: colors.accent, opacity: 0.4, borderRadius: 0.5 }} />
        <Box sx={{ height: 2, width: "80%", bgcolor: "grey.300", borderRadius: 0.5 }} />
        <Box sx={{ height: 2, width: "70%", bgcolor: "grey.300", borderRadius: 0.5 }} />
        <Box sx={{ height: 2, width: "90%", bgcolor: "grey.300", borderRadius: 0.5 }} />
        <Box sx={{ mt: "auto", height: 2, width: "50%", bgcolor: colors.accent, opacity: 0.3, borderRadius: 0.5 }} />
      </Box>
    </Box>
  );
}

function TemplateCard({ template, selected, onSelect }) {
  return (
    <Box
      component="label"
      tabIndex={0}
      onClick={() => onSelect(template.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(template.id);
        }
      }}
      sx={{
        display: "flex",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        border: "2px solid",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "primary.50" : "background.paper",
        cursor: "pointer",
        transition: "all 150ms ease",
        "&:hover": { borderColor: "primary.light", bgcolor: "primary.50" },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
      }}
    >
      <TemplateThumbnail templateId={template.id} selected={selected} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {template.label}
          </Typography>
          {selected && <CheckCircle fontSize="small" color="primary" />}
        </Box>
        {template.description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            {template.description}
          </Typography>
        )}
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
          {template.supportsPdf && <Chip size="small" label="PDF" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
          {template.supportsDocx && <Chip size="small" label="DOCX" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
          {template.supportsMarkdown && <Chip size="small" label="MD" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
        </Stack>
      </Box>
      <Radio
        checked={selected}
        size="small"
        sx={{ m: 0, alignSelf: "flex-start", mt: 0.5 }}
        tabIndex={-1}
      />
    </Box>
  );
}

export default function TemplatePicker({ value, onChange }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const triggerRef = useRef(null);

  const selectedId = getSafeTemplateId(value);
  const selectedMeta = TEMPLATE_REGISTRY[selectedId];
  const templates = Object.values(TEMPLATE_REGISTRY).sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0));

  const handleOpen = useCallback(() => {
    if (isMobile) {
      setDialogOpen(true);
    } else {
      setAnchorEl(triggerRef.current);
    }
  }, [isMobile]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setDialogOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleSelect = useCallback((templateId) => {
    if (templateId !== selectedId) {
      onChange(templateId);
    }
    handleClose();
  }, [selectedId, onChange, handleClose]);

  const renderGrid = () => (
    <RadioGroup
      value={selectedId}
      onChange={(e) => handleSelect(e.target.value)}
      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
    >
      {templates.map((tpl) => (
        <TemplateCard
          key={tpl.id}
          template={tpl}
          selected={tpl.id === selectedId}
          onSelect={handleSelect}
        />
      ))}
    </RadioGroup>
  );

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outlined"
        size="small"
        endIcon={<ExpandMore />}
        onClick={handleOpen}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl) || dialogOpen}
        sx={{ minWidth: 180, textTransform: "none" }}
      >
        {selectedMeta?.label || "Шаблон"}
      </Button>

      {!isMobile && (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{ paper: { sx: { p: 2, maxWidth: 360, maxHeight: 480, overflow: "auto" } } }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Выберите шаблон
          </Typography>
          {renderGrid()}
        </Popover>
      )}

      {isMobile && (
        <Dialog
          open={dialogOpen}
          onClose={handleClose}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { m: 1, maxHeight: "90vh" } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
            Выберите шаблон
            <IconButton onClick={handleClose} size="small" aria-label="Закрыть">
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 0 }}>
            {renderGrid()}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
