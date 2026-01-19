// src/components/layout/LayoutWrapper.jsx
import React from "react";
import { Box, Container } from "@mui/material";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutWrapper({ children }) {
  const { pathname } = useLocation();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isHome = pathname === "/";

  // auth — узко, home — средне, остальное — широко
  const maxWidth = isAuthPage ? "md" : isHome ? "md" : "xl";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <Box component="main" sx={{ flex: 1, py: 4 }}>
        <Container maxWidth={maxWidth}>{children}</Container>
      </Box>

      <Footer />
    </Box>
  );
}