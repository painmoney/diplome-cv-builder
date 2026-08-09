import { describe, expect, it, vi } from "vitest";

import { waitForImages } from "../waitForImages";

describe("waitForImages", () => {
  it("resolves immediately when the container has no images", async () => {
    const container = document.createElement("div");

    await expect(waitForImages(container)).resolves.toEqual([]);
  });

  it("waits for an unfinished image to load", async () => {
    const container = document.createElement("div");
    const image = document.createElement("img");
    Object.defineProperty(image, "complete", { value: false });
    container.appendChild(image);

    const pending = waitForImages(container, 1000);
    image.dispatchEvent(new Event("load"));

    await expect(pending).resolves.toHaveLength(1);
  });

  it("decodes an already loaded image when supported", async () => {
    const container = document.createElement("div");
    const image = document.createElement("img");
    const decode = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(image, "complete", { value: true });
    Object.defineProperty(image, "decode", { value: decode });
    container.appendChild(image);

    await waitForImages(container);

    expect(decode).toHaveBeenCalledOnce();
  });
});
