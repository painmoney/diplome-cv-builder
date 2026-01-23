import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

/**
 * Splash с эффектом печати.
 */
export default function SplashScreen({ onFinish, text = "CV Builder" }) {
  const theme = useTheme();
  const [typed, setTyped] = useState("");
  const timersRef = useRef([]);
  const onFinishRef = useRef(onFinish);

  const isDark = theme.palette.mode === "dark";
  const accent2 = isDark ? "#a78bfa" : "#dc004e";

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    // блокируем скролл, пока splash активен
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimers();
    setTyped("");

    const full = String(text || "");
    const stepMs = 120;
    const holdMs = 800;

    let i = 0;

    const done = () => onFinishRef.current?.();

    const tick = () => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i < full.length) {
        timersRef.current.push(setTimeout(tick, stepMs));
      } else {
        timersRef.current.push(setTimeout(done, holdMs));
      }
    };

    if (!full.length) {
      timersRef.current.push(setTimeout(done, holdMs));
      return () => clearTimers();
    }

    timersRef.current.push(setTimeout(tick, 0));
    return () => clearTimers();
  }, [text]);

  const handleSkip = () => {
    clearTimers();
    onFinishRef.current?.();
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.55, ease: "easeInOut" } }}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        bgcolor: "background.default",
        backgroundImage: isDark
          ? `radial-gradient(900px 500px at 20% -10%, rgba(88,166,255,0.22), transparent 55%),
             radial-gradient(900px 500px at 85% 10%, rgba(167,139,250,0.16), transparent 55%),
             radial-gradient(900px 500px at 50% 120%, rgba(34,211,238,0.10), transparent 55%)`
          : `radial-gradient(900px 500px at 15% -10%, rgba(25,118,210,0.20), transparent 55%),
             radial-gradient(900px 500px at 90% 10%, rgba(220,0,78,0.12), transparent 55%),
             radial-gradient(900px 500px at 50% 120%, rgba(46,125,50,0.10), transparent 55%)`,
      }}
      role="presentation"
      onClick={handleSkip}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <Button
          size="small"
          variant="text"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          sx={{ color: "text.secondary" }}
        >
          Пропустить
        </Button>
      </Box>

      <Box sx={{ textAlign: "center", px: 2 }}>
        <Typography
          component={motion.div}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { duration: 0.45 } }}
          variant="h2"
          sx={{
            fontWeight: 900,
            letterSpacing: 1.5,
            lineHeight: 1.05,
            fontSize: { xs: "2.2rem", sm: "3.4rem", md: "4.2rem" },
            backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${accent2})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            userSelect: "none",
          }}
        >
          {typed}
          <Box
            component="span"
            sx={{
              display: "inline-block",
              width: "0.65ch",
              height: "1em",
              transform: "translateY(0.12em)",
              ml: 0.5,
              borderRadius: 0.5,
              bgcolor: "currentColor",
              animation: "cvBlink 1s step-end infinite",
              "@keyframes cvBlink": {
                "0%, 49%": { opacity: 1 },
                "50%, 100%": { opacity: 0 },
              },
            }}
          />
        </Typography>

        <Typography
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.35 } }}
          variant="body2"
          sx={{ mt: 1.5, color: "text.secondary" }}
        >
          Генератор IT-резюме • рекомендации • экспорт
        </Typography>
      </Box>
    </Box>
  );
}
