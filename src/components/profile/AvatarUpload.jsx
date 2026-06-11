import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import Cropper from "react-easy-crop";
import { uploadAvatar, getAvatarUrl } from "../../api/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const AVATAR_SIZE = 300;
const AVATAR_QUALITY = 0.82;

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
  displayName = "",
  onAvatarChange,
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

  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    setPreviewUrl(avatarUrl || "");
  }, [avatarUrl]);

  useEffect(() => {
    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl);
      }
    };
  }, [sourceImageUrl]);

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
    setCroppedAreaPixels(null);
    setCropDialogOpen(true);
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleApplyCrop = async () => {
    if (!sourceImageUrl || !croppedAreaPixels) return;

    setProcessing(true);

    try {
      const croppedFile = await getCroppedImage(sourceImageUrl, croppedAreaPixels);
      const localPreviewUrl = URL.createObjectURL(croppedFile);

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
      console.error("Avatar crop error:", error);

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
      await uploadAvatar(userId, avatarFile);

      const url = getAvatarUrl(userId);
      const previewWithCacheBuster = `${url}?t=${Date.now()}`;

      setPreviewUrl(previewWithCacheBuster);
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
      console.error("Avatar upload error:", error);

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
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
      <Avatar
        src={previewUrl}
        imgProps={{ alt: "Аватар пользователя" }}
        sx={{ width: 100, height: 100 }}
      >
        {!previewUrl && displayName?.charAt(0)?.toUpperCase()}
      </Avatar>

      <Box>
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
      </Box>

      <Dialog
        open={cropDialogOpen}
        onClose={handleCloseCropDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Выбор области аватара</DialogTitle>

        <DialogContent>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 360,
              bgcolor: "background.default",
              mt: 1,
            }}
          >
            {sourceImageUrl && (
              <Cropper
                image={sourceImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            )}
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Масштаб
            </Typography>

            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(_, value) => setZoom(value)}
              disabled={processing}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Переместите изображение и выберите область, которая будет отображаться
            в круглом аватаре.
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