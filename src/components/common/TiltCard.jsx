import { useEffect, useRef } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";

function subscribeToMediaQuery(mediaQuery, listener) {
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }

  mediaQuery.addListener?.(listener);
  return () => mediaQuery.removeListener?.(listener);
}

export default function TiltCard({
  children,
  tiltLimit = 5,
  scale = 1.012,
  perspective = 1400,
  spotlight = true,
  disabled = false,
  sx,
  style,
  ...other
}) {
  const theme = useTheme();
  const rootRef = useRef(null);
  const frameRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return undefined;

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    const coarsePointer = window.matchMedia(COARSE_POINTER_QUERY);
    let effectEnabled = !disabled && !reducedMotion.matches && !coarsePointer.matches;

    const reset = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      element.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";
      element.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
      element.style.setProperty("--tilt-spotlight-opacity", "0");
    };

    const updateAvailability = () => {
      effectEnabled = !disabled && !reducedMotion.matches && !coarsePointer.matches;
      if (!effectEnabled) reset();
    };

    const applyTilt = () => {
      frameRef.current = null;
      if (!effectEnabled) return;

      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = Math.min(Math.max((pointerRef.current.x - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((pointerRef.current.y - rect.top) / rect.height, 0), 1);
      const rotateX = (0.5 - y) * tiltLimit * 2;
      const rotateY = (x - 0.5) * tiltLimit * 2;

      element.style.transition = "transform 90ms ease-out";
      element.style.transform = `perspective(${perspective}px) rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg) scale(${scale})`;
      element.style.setProperty("--tilt-spotlight-x", `${(x * 100).toFixed(2)}%`);
      element.style.setProperty("--tilt-spotlight-y", `${(y * 100).toFixed(2)}%`);
      element.style.setProperty("--tilt-spotlight-opacity", spotlight ? "1" : "0");
    };

    const handlePointerMove = (event) => {
      if (!effectEnabled || event.pointerType === "touch") return;

      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(applyTilt);
      }
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerleave", reset);
    element.addEventListener("pointercancel", reset);
    const unsubscribeReducedMotion = subscribeToMediaQuery(reducedMotion, updateAvailability);
    const unsubscribeCoarsePointer = subscribeToMediaQuery(coarsePointer, updateAvailability);

    updateAvailability();

    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", reset);
      element.removeEventListener("pointercancel", reset);
      unsubscribeReducedMotion();
      unsubscribeCoarsePointer();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [disabled, perspective, scale, spotlight, tiltLimit]);

  const spotlightColor =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.white, 0.1)
      : alpha(theme.palette.primary.main, 0.07);

  return (
    <Box
      ref={rootRef}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        borderRadius: `${theme.shape.borderRadius}px`,
        transformStyle: "preserve-3d",
        transformOrigin: "center",
        willChange: "transform",
        "@media (pointer: coarse), (prefers-reduced-motion: reduce)": {
          transform: "none !important",
          transition: "none !important",
          willChange: "auto",
          "& .TiltCard-spotlight": { display: "none" },
        },
        ...sx,
      }}
      style={{
        ...style,
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
        transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        "--tilt-spotlight-x": "50%",
        "--tilt-spotlight-y": "50%",
        "--tilt-spotlight-opacity": 0,
      }}
      {...other}
    >
      {children}
      {spotlight && (
        <Box
          aria-hidden="true"
          className="TiltCard-spotlight"
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: "var(--tilt-spotlight-opacity)",
            background: `radial-gradient(circle at var(--tilt-spotlight-x) var(--tilt-spotlight-y), ${spotlightColor} 0%, transparent 58%)`,
            transition: "opacity 180ms ease",
          }}
        />
      )}
    </Box>
  );
}
