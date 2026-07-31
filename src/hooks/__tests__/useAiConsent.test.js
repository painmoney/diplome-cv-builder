import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAiConsent, readConsent, clearConsent, CONSENT_VERSION } from "../useAiConsent";

beforeEach(() => {
  localStorage.clear();
});

describe("useAiConsent", () => {
  it("does not show dialog and runs action immediately when consented", () => {
    localStorage.setItem("cv_ai_consent", JSON.stringify({ version: CONSENT_VERSION, acceptedAt: new Date().toISOString() }));

    const { result } = renderHook(() => useAiConsent());
    const action = vi.fn();

    act(() => {
      result.current.requestAiAction(action);
    });

    expect(action).toHaveBeenCalled();
    expect(result.current.open).toBe(false);
  });

  it("shows dialog when not consented", () => {
    const { result } = renderHook(() => useAiConsent());
    const action = vi.fn();

    act(() => {
      result.current.requestAiAction(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.open).toBe(true);
  });

  it("does not show dialog again after confirmation", () => {
    const { result } = renderHook(() => useAiConsent());
    const action = vi.fn();

    act(() => {
      result.current.requestAiAction(action);
    });

    act(() => {
      result.current.handleConfirm();
    });

    expect(action).toHaveBeenCalled();
    expect(result.current.open).toBe(false);

    const action2 = vi.fn();
    act(() => {
      result.current.requestAiAction(action2);
    });

    expect(action2).toHaveBeenCalled();
    expect(result.current.open).toBe(false);
  });

  it("shows dialog again after revocation", () => {
    const { result } = renderHook(() => useAiConsent());

    act(() => {
      result.current.requestAiAction(vi.fn());
    });
    act(() => {
      result.current.handleConfirm();
    });

    act(() => {
      result.current.revokeConsent();
    });

    const action = vi.fn();
    act(() => {
      result.current.requestAiAction(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.open).toBe(true);
  });

  it("dismiss does not run action", () => {
    const { result } = renderHook(() => useAiConsent());
    const action = vi.fn();

    act(() => {
      result.current.requestAiAction(action);
    });

    act(() => {
      result.current.handleDismiss();
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.open).toBe(false);
  });
});

describe("readConsent / clearConsent", () => {
  it("returns null when no consent stored", () => {
    expect(readConsent()).toBeNull();
  });

  it("returns consent data when valid", () => {
    const data = { version: CONSENT_VERSION, acceptedAt: "2026-01-01T00:00:00Z" };
    localStorage.setItem("cv_ai_consent", JSON.stringify(data));
    expect(readConsent()).toEqual(data);
  });

  it("returns null for old version", () => {
    localStorage.setItem("cv_ai_consent", JSON.stringify({ version: 0, acceptedAt: "2026-01-01T00:00:00Z" }));
    expect(readConsent()).toBeNull();
  });

  it("clearConsent removes stored consent", () => {
    localStorage.setItem("cv_ai_consent", JSON.stringify({ version: CONSENT_VERSION, acceptedAt: "2026-01-01T00:00:00Z" }));
    clearConsent();
    expect(readConsent()).toBeNull();
  });
});
