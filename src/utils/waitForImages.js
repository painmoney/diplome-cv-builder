function waitForImage(image, timeoutMs) {
  if (image.complete) {
    return typeof image.decode === "function"
      ? image.decode().catch(() => undefined)
      : Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeoutId;

    const finish = () => {
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      window.clearTimeout(timeoutId);
      resolve();
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    timeoutId = window.setTimeout(finish, timeoutMs);
  });
}

export function waitForImages(container, timeoutMs = 5000) {
  if (!container) return Promise.resolve();

  const images = Array.from(container.querySelectorAll("img"));
  return Promise.all(images.map((image) => waitForImage(image, timeoutMs)));
}
