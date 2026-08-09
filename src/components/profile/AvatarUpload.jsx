import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { CircleOutlined, CropSquare, PhotoCamera } from "@mui/icons-material";
import Cropper from "react-easy-crop";
import { uploadAvatar, getAvatarUrl } from "../../api/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_SIZE = 300;
const AVATAR_QUALITY = 0.82;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function normalizeAvatarShape(value) {
  return value === "square" ? "square" : "round";
}

function AvatarShapeSelector({ value, onChange, disabled, fullWidth = false }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      fullWidth={fullWidth}
      onChange={(_, nextValue) => nextValue && onChange(nextValue)}
      aria-label="Форма аватара"
      disabled={disabled}
    >
      <ToggleButton value="round" aria-label="Круглый аватар">
        <CircleOutlined fontSize="small" sx={{ mr: 0.75 }} />
        Круг
      </ToggleButton>
      <ToggleButton value="square" aria-label="Квадратный аватар">
        <CropSquare fontSize="small" sx={{ mr: 0.75 }} />
        Квадрат
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImage(imageSrc, croppedAreaPixels) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas не поддерживается браузером");
  }

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE
  );

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", AVATAR_QUALITY);
  });

  if (!blob) {
    throw new Error("Не удалось обработать изображение");
  }

  return new File([blob], "avatar.webp", {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export default function AvatarUpload({
  userId,
  avatarUrl = "",
  avatarShape = "round",
  displayName = "",
  onAvatarChange,
  onAvatarShapeChange,
  disabled = false,
}) {
  const [previewUrl, setPreviewUrl] = useState(avatarUrl || "");
  const [sourceImageUrl, setSourceImageUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState("");

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [mediaSize, setMediaSize] = useState(null);
  const [cropSize, setCropSize] = useState(null);
  const [selectedShape, setSelectedShape] = useState(
    normalizeAvatarShape(avatarShape)
  );
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const cropDragRef = useRef(null);

  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    setPreviewUrl(avatarUrl || ""); // eslint-disable-line react-hooks/set-state-in-effect -- prop-to-state sync
  }, [avatarUrl]);

  useEffect(() => {
    setSelectedShape(normalizeAvatarShape(avatarShape)); // eslint-disable-line react-hooks/set-state-in-effect -- prop-to-state sync
  }, [avatarShape]);

  useEffect(() => {
    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl);
      }
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [sourceImageUrl, previewUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSnackbar({
        open: true,
        message: "Выберите изображение",
        severity: "error",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSnackbar({
        open: true,
        message: "Файл больше 5 MB",
        severity: "error",
      });
      return;
    }

    if (sourceImageUrl) {
      URL.revokeObjectURL(sourceImageUrl);
    }

    const objectUrl = URL.createObjectURL(file);

    setSourceImageUrl(objectUrl);
    setOriginalFileName(file.name);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMediaSize(null);
    setCropSize(null);
    setCroppedAreaPixels(null);
    setCropDialogOpen(true);
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const restrictCrop = (nextCrop, zoomValue = zoom) => {
    if (!mediaSize || !cropSize) return nextCrop;

    const maxX = Math.max(0, (mediaSize.width * zoomValue - cropSize.width) / 2);
    const maxY = Math.max(0, (mediaSize.height * zoomValue - cropSize.height) / 2);

    return {
      x: Math.min(Math.max(nextCrop.x, -maxX), maxX),
      y: Math.min(Math.max(nextCrop.y, -maxY), maxY),
    };
  };

  const handleCropPointerDown = (event) => {
    if (processing || event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    cropDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
    };
    setIsDraggingCrop(true);
  };

  const handleCropPointerMove = (event) => {
    const drag = cropDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    setCrop(
      restrictCrop({
        x: drag.startCrop.x + event.clientX - drag.startX,
        y: drag.startCrop.y + event.clientY - drag.startY,
      })
    );
  };

  const finishCropPointerDrag = (event) => {
    const drag = cropDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    cropDragRef.current = null;
    setIsDraggingCrop(false);
  };

  const handleCropWheel = (event) => {
    if (processing) return;
    event.preventDefault();
    const nextZoom = Math.min(
      Math.max(zoom - event.deltaY * 0.001, MIN_ZOOM),
      MAX_ZOOM
    );
    setZoom(Number(nextZoom.toFixed(2)));
  };

  const handleCropKeyDown = (event) => {
    const direction = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    }[event.key];

    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 2;
    setCrop((current) =>
      restrictCrop({
        x: current.x + direction.x * step,
        y: current.y + direction.y * step,
      })
    );
  };

  const handleShapeChange = (nextShape) => {
    const normalizedShape = normalizeAvatarShape(nextShape);
    setSelectedShape(normalizedShape);
    onAvatarShapeChange?.(normalizedShape);
  };

  const handleZoomPointerDown = (event) => {
    if (processing) return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;

    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const nextZoom = MIN_ZOOM + ratio * (MAX_ZOOM - MIN_ZOOM);
    setZoom(Number(nextZoom.toFixed(2)));
  };

  const handleApplyCrop = async () => {
    if (!sourceImageUrl || !croppedAreaPixels) return;

    setProcessing(true);

    try {
      const croppedFile = await getCroppedImage(sourceImageUrl, croppedAreaPixels);
      const localPreviewUrl = URL.createObjectURL(croppedFile);

      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setAvatarFile(croppedFile);
      setPreviewUrl(localPreviewUrl);
      setCropDialogOpen(false);

      setSnackbar({
        open: true,
        message: `Изображение подготовлено: ${(croppedFile.size / 1024).toFixed(
          1
        )} KB`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Ошибка обработки изображения: ${error.message}`,
        severity: "error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseCropDialog = () => {
    setCropDialogOpen(false);
  };

  const handleUpload = async () => {
    if (!userId) {
      setSnackbar({
        open: true,
        message: "Пользователь не авторизован",
        severity: "error",
      });
      return;
    }

    if (!avatarFile) {
      setSnackbar({
        open: true,
        message: "Сначала выберите и обрежьте изображение",
        severity: "warning",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadedAvatar = await uploadAvatar(userId, avatarFile);
      const fileName = uploadedAvatar.path?.split("/").pop();

      if (!fileName) {
        throw new Error("Хранилище не вернуло путь загруженного файла");
      }

      const url = getAvatarUrl(userId, fileName);

      setPreviewUrl(url);
      setAvatarFile(null);
      setOriginalFileName("");

      if (typeof onAvatarChange === "function") {
        onAvatarChange(url);
      }

      setSnackbar({
        open: true,
        message: "Аватар загружен",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Ошибка загрузки: ${error.message}`,
        severity: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const isBusy = disabled || uploading || processing;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        mb: 3,
      }}
    >
      <Avatar
        src={previewUrl}
        imgProps={{ alt: "Аватар пользователя" }}
        variant={selectedShape === "square" ? "square" : "circular"}
        sx={{ width: 100, height: 100 }}
      >
        {!previewUrl && displayName?.charAt(0)?.toUpperCase()}
      </Avatar>

      <Box sx={{ minWidth: { xs: "100%", sm: 280 }, flex: 1 }}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<PhotoCamera />}
          disabled={isBusy}
        >
          Выбрать фото
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>

        {avatarFile && (
          <Button
            variant="contained"
            sx={{ ml: 2 }}
            onClick={handleUpload}
            disabled={isBusy}
          >
            {uploading ? "Загрузка..." : "Загрузить"}
          </Button>
        )}

        {avatarFile && (
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            {originalFileName} → avatar.webp, {(avatarFile.size / 1024).toFixed(
              1
            )} KB
          </Typography>
        )}

        <Box sx={{ mt: 1.5, maxWidth: 300 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
            Форма фото в резюме
          </Typography>
          <AvatarShapeSelector
            value={selectedShape}
            onChange={handleShapeChange}
            disabled={isBusy}
            fullWidth
          />
        </Box>
      </Box>

      <Dialog
        open={cropDialogOpen}
        onClose={handleCloseCropDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Выбор области аватара</DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Форма аватара
            </Typography>
            <AvatarShapeSelector
              value={selectedShape}
              onChange={handleShapeChange}
              disabled={processing}
              fullWidth
            />
          </Box>

          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 360,
              bgcolor: "background.default",
              cursor: isDraggingCrop ? "grabbing" : "grab",
            }}
          >
            {sourceImageUrl && (
              <Cropper
                image={sourceImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape={selectedShape === "square" ? "rect" : "round"}
                showGrid={false}
                zoomWithScroll
                zoomSpeed={0.2}
                style={{
                  containerStyle: {
                    cursor: isDraggingCrop ? "grabbing" : "grab",
                    touchAction: "none",
                  },
                  cropAreaStyle: { pointerEvents: "none" },
                }}
                mediaProps={{
                  draggable: false,
                  onDragStart: (event) => event.preventDefault(),
                }}
                cropperProps={{ "aria-label": "Область кадрирования" }}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                onCropAreaChange={handleCropComplete}
                setMediaSize={setMediaSize}
                setCropSize={setCropSize}
                onInteractionStart={() => setIsDraggingCrop(true)}
                onInteractionEnd={() => setIsDraggingCrop(false)}
              />
            )}

            {sourceImageUrl && (
              <Box
                role="application"
                aria-label="Перемещение фотографии в области кадрирования"
                tabIndex={0}
                data-testid="avatar-crop-drag-surface"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={finishCropPointerDrag}
                onPointerCancel={finishCropPointerDrag}
                onWheel={handleCropWheel}
                onKeyDown={handleCropKeyDown}
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  cursor: isDraggingCrop ? "grabbing" : "grab",
                  touchAction: "none",
                  outline: "none",
                  "&:focus-visible": {
                    boxShadow: "inset 0 0 0 2px",
                    color: "primary.main",
                  },
                }}
              />
            )}
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Масштаб
            </Typography>

            <Slider
              value={zoom}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value.toFixed(2)}x`}
              onPointerDown={handleZoomPointerDown}
              onChange={(_, value) => setZoom(Array.isArray(value) ? value[0] : value)}
              disabled={processing}
              slotProps={{ input: { "aria-label": "Масштаб аватара" } }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Зажмите изображение левой кнопкой мыши и перемещайте его. Масштаб можно
            выбрать кликом или перетаскиванием по полосе; точная подстройка области
            масштаба также доступна стрелками на клавиатуре.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCropDialog} disabled={processing}>
            Отмена
          </Button>

          <Button
            variant="contained"
            onClick={handleApplyCrop}
            disabled={processing}
          >
            {processing ? "Обработка..." : "Применить"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
