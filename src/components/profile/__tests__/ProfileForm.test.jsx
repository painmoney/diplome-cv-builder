import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("../../../utils/aiService", () => ({
  isAIAvailable: () => false,
  generateAboutMe: vi.fn(),
}));

vi.mock("../../../hooks/useAiConsent", () => ({
  useAiConsent: () => ({
    open: false,
    requestAiAction: vi.fn(),
    handleConfirm: vi.fn(),
    handleDismiss: vi.fn(),
    revokeConsent: vi.fn(),
  }),
}));

vi.mock("../AvatarUpload", () => ({
  default: () => <div data-testid="avatar-upload" />,
}));

vi.mock("../../common/AiConsentDialog", () => ({
  default: () => null,
}));

import ProfileForm from "../ProfileForm";

afterEach(cleanup);

describe("ProfileForm age", () => {
  it("keeps an optional empty age empty", () => {
    render(<ProfileForm data={{ age: "" }} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Возраст")).toHaveValue(null);
  });

  it("writes a valid age as a number into profile data", () => {
    const onChange = vi.fn();
    render(<ProfileForm data={{ name: "Test", age: "" }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Возраст"), {
      target: { value: "22" },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test", age: 22 })
    );
  });

  it("shows the existing profile validation error", () => {
    render(
      <ProfileForm
        data={{ age: 101 }}
        errors={{ age: "Укажите целый возраст от 14 до 100 лет" }}
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByText("Укажите целый возраст от 14 до 100 лет")
    ).toBeInTheDocument();
  });
});
