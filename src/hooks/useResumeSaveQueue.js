import { useRef, useCallback } from "react";
import { SaveQueue } from "./saveQueueController";
import {
  createResumeFullRpc,
  saveResumeFullRpc,
  saveProfile,
  normalizeLoadedResumeData,
} from "../api/resumeService";

/**
 * React hook wrapper around SaveQueue controller.
 */
export function useResumeSaveQueue({ userRef, setSaveStatus, setSaveError, setMessage }) {
  const queueRef = useRef(null);
  if (!queueRef.current) { // eslint-disable-line react-hooks/refs -- lazy init
    queueRef.current = new SaveQueue({
      userRef, setSaveStatus, setSaveError, setMessage,
      rpcs: { createResumeFullRpc, saveResumeFullRpc, saveProfile, normalizeLoadedResumeData },
    });
  }

  const enqueue = useCallback((snapshot) => queueRef.current.enqueue(snapshot), []);
  const resetGeneration = useCallback(() => queueRef.current.resetGeneration(), []);
  const initFromLoad = useCallback((loadedResume) => queueRef.current.initFromLoad(loadedResume), []);

  return { enqueue, resetGeneration, initFromLoad, queue: queueRef.current }; // eslint-disable-line react-hooks/refs -- returning stable ref
}
