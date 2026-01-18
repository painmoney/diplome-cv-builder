// src/components/layout/LayoutWrapper.jsx
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { Box } from "@mui/material";

export default function LayoutWrapper({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh", // чтобы футер был внизу
      }}
    >
      <Header />

      <Box
        sx={{
          display: "flex",
          flex: 1,
          width: "100%",
        }}
      >
        {/* Sidebar слева, если нужно */}
        <Sidebar />

        {/* Основной контент */}
        <Box
          component="main"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center", // вертикальное центрирование для коротких страниц
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
