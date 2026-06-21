/**
 * Create a fingerprint of title + data for autosave hydration gate comparison.
 * Used to skip autosave when no real user edit has occurred since last load.
 */
export const autosaveFingerprint = (title, data) =>
  JSON.stringify({ title: title ?? "", data });
