import { useEffect, useMemo, useReducer } from "react";

function useReducedMotion() {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case "TICK": {
      const { phrases, typingSpeed, deletingSpeed, pauseMs } = action.payload;
      const current = phrases[state.index];

      if (!state.isDeleting) {
        if (state.displayed.length < current.length) {
          return {
            ...state,
            displayed: current.slice(0, state.displayed.length + 1),
            timeout: typingSpeed,
          };
        }
        return { ...state, timeout: pauseMs, phase: "pause" };
      }

      if (state.displayed.length > 0) {
        return {
          ...state,
          displayed: state.displayed.slice(0, -1),
          timeout: deletingSpeed,
        };
      }

      return {
        ...state,
        index: (state.index + 1) % phrases.length,
        isDeleting: false,
        timeout: 0,
      };
    }
    case "PAUSE_DONE":
      return { ...state, isDeleting: true, timeout: 0, phase: "delete" };
    default:
      return state;
  }
}

export default function TypewriterText({
  phrases = [],
  typingSpeed = 70,
  deletingSpeed = 35,
  pauseMs = 1400,
  className,
  sx,
}) {
  const reduced = useReducedMotion();

  const safePhrases = useMemo(
    () => (phrases.length ? phrases : [""]),
    [phrases]
  );

  const [state, dispatch] = useReducer(reducer, {
    index: 0,
    displayed: "",
    isDeleting: false,
    timeout: 0,
    phase: "type",
  });

  useEffect(() => {
    if (reduced || !safePhrases.length) return;

    if (state.phase === "pause") {
      const t = setTimeout(() => dispatch({ type: "PAUSE_DONE" }), state.timeout);
      return () => clearTimeout(t);
    }

    if (state.timeout === 0 && !state.isDeleting && state.displayed.length === safePhrases[state.index]?.length) {
      const t = setTimeout(() => dispatch({ type: "PAUSE_DONE" }), pauseMs);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      dispatch({
        type: "TICK",
        payload: { phrases: safePhrases, typingSpeed, deletingSpeed, pauseMs },
      });
    }, state.timeout || typingSpeed);

    return () => clearTimeout(t);
  }, [
    state,
    safePhrases,
    typingSpeed,
    deletingSpeed,
    pauseMs,
    reduced,
  ]);

  const text = reduced ? safePhrases[0] : state.displayed;

  return (
    <span className={className} style={sx}>
      {text}
      {!reduced && <span className="typewriter-caret" />}
    </span>
  );
}
