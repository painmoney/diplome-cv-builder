function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", reject, { once: true });
    image.src = source;
  });
}

export async function convertImageToPngDataUrl(source) {
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) throw new Error("AVATAR_DOWNLOAD_FAILED");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(objectUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error("AVATAR_HAS_INVALID_SIZE");

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("CANVAS_UNAVAILABLE");

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareResumeDataForPdf(
  resumeData,
  converter = convertImageToPngDataUrl
) {
  const photo = String(resumeData?.profile?.photo || "").trim();
  if (!photo || /^data:image\/(png|jpe?g);/i.test(photo)) {
    return { data: resumeData, photoOmitted: false };
  }

  try {
    const convertedPhoto = await converter(photo);
    return {
      data: {
        ...resumeData,
        profile: { ...resumeData.profile, photo: convertedPhoto },
      },
      photoOmitted: false,
    };
  } catch {
    return {
      data: {
        ...resumeData,
        profile: { ...resumeData.profile, photo: "" },
      },
      photoOmitted: true,
    };
  }
}
