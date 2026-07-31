import { useState, useCallback } from "react";

const STORAGE_KEY = "cv_ai_consent";
const CONSENT_VERSION = 1;

function readConsent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === CONSENT_VERSION && parsed.acceptedAt) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeConsent() {
  const data = { version: CONSENT_VERSION, acceptedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearConsent() {
  localStorage.removeItem(STORAGE_KEY);
}

export { CONSENT_VERSION, readConsent, clearConsent };

export function useAiConsent() {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [consented, setConsented] = useState(() => readConsent() !== null);

  const requestAiAction = useCallback(
    (action) => {
      if (consented) {
        action();
        return;
      }
      setPendingAction(() => action);
      setOpen(true);
    },
    [consented]
  );

  const handleConfirm = useCallback(() => {
    writeConsent();
    setConsented(true);
    setOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    setPendingAction(null);
  }, []);

  const revokeConsent = useCallback(() => {
    clearConsent();
    setConsented(false);
  }, []);

  return { open, consented, requestAiAction, handleConfirm, handleDismiss, revokeConsent };
}
