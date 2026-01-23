import React, { useState } from "react";
import { Box, Container } from "@mui/material";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import SplashScreen from "./SplashScreen";

export default function LayoutWrapper({ children }) {
  const { pathname } = useLocation();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isHome = pathname === "/";

  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("cv_splash_seen") !== "1";
    } catch {
      return true;
    }
  });

  const handleSplashFinish = () => {
    try {
      sessionStorage.setItem("cv_splash_seen", "1");
    } catch {
      // ignore
    }
    setShowSplash(false);
  };

  const maxWidth = isAuthPage ? "md" : isHome ? "lg" : "xl";
  const mainPy = isHome ? 0 : 4;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen key="cv_splash" onFinish={handleSplashFinish} />
        )}
      </AnimatePresence>

      <Header />

      <Box component="main" sx={{ flex: 1, py: mainPy }}>
        <Container maxWidth={maxWidth}>{children}</Container>
      </Box>

      <Footer />
    </Box>
  );
}