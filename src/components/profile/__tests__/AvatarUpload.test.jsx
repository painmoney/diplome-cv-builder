import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AvatarUpload from "../AvatarUpload";

vi.mock("react-easy-crop", async () => {
  const React = await import("react");

  return {
    default: function CropperMock(props) {
      React.useEffect(() => {
        props.setMediaSize?.({ width: 600, height: 800 });
        props.setCropSize?.({ width: 300, height: 300 });
        props.onCropComplete?.({}, { x: 0, y: 0, width: 300, height: 300 });
      }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initialize the cropper mock once

      return (
        <div
          data-testid="cropper-state"
          data-crop-x={props.crop.x}
          data-crop-y={props.crop.y}
        />
      );
    },
  };
});

vi.mock("../../../api/storage", () => ({
  uploadAvatar: vi.fn(),
  getAvatarUrl: vi.fn(),
}));

describe("AvatarUpload", () => {
  it("lets the user switch the avatar to a square frame", () => {
    const onAvatarShapeChange = vi.fn();

    render(
      <AvatarUpload
        userId="user-1"
        avatarUrl="https://cdn.test/avatar.webp"
        onAvatarShapeChange={onAvatarShapeChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Квадратный аватар" }));

    expect(onAvatarShapeChange).toHaveBeenCalledWith("square");
    expect(screen.getByRole("button", { name: "Квадратный аватар" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: "Аватар пользователя" }).parentElement).toHaveClass("MuiAvatar-square");
  });

  it("moves the photo while the primary pointer is held", () => {
    URL.createObjectURL = vi.fn(() => "blob:avatar-source");
    URL.revokeObjectURL = vi.fn();
    const { container } = render(<AvatarUpload userId="user-1" />);

    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: {
        files: [new File(["photo"], "photo.jpg", { type: "image/jpeg" })],
      },
    });

    const surface = screen.getByTestId("avatar-crop-drag-surface");
    surface.setPointerCapture = vi.fn();
    surface.hasPointerCapture = vi.fn(() => true);
    surface.releasePointerCapture = vi.fn();

    fireEvent.pointerDown(surface, {
      pointerId: 1,
      button: 0,
      clientX: 200,
      clientY: 200,
    });
    fireEvent.pointerMove(surface, {
      pointerId: 1,
      clientX: 250,
      clientY: 240,
    });

    expect(screen.getByTestId("cropper-state")).toHaveAttribute("data-crop-x", "50");
    expect(screen.getByTestId("cropper-state")).toHaveAttribute("data-crop-y", "40");
  });
});
