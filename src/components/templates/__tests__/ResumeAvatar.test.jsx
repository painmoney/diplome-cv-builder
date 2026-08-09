import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import ResumeAvatar from "../ResumeAvatar";

describe("ResumeAvatar", () => {
  it("renders the profile photo with accessible text", () => {
    render(
      <ResumeAvatar
        profile={{ name: "Иван Иванов", photo: "https://cdn.test/avatar.webp" }}
      />
    );

    const image = screen.getByRole("img", { name: "Фото Иван Иванов" });
    expect(image.getAttribute("src")).toBe("https://cdn.test/avatar.webp");
    expect(image.getAttribute("crossorigin")).toBe("anonymous");
  });

  it("does not render an image without a photo", () => {
    const { container } = render(<ResumeAvatar profile={{ name: "Иван" }} />);

    expect(container.querySelector("img")).toBeNull();
  });

  it("uses a compact square frame when selected", () => {
    const { container } = render(
      <ResumeAvatar
        profile={{ photo: "https://cdn.test/avatar.webp", avatarShape: "square" }}
      />
    );

    expect(container.querySelector("img")).toHaveStyle({ borderRadius: "2mm" });
  });
});
