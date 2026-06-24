import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: [
      ...configDefaults.exclude,
      "tests/**",
      ".mimocode/**",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-mui": [
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled",
          ],
          "vendor-pdf": ["@react-pdf/renderer", "html2canvas"],
          "vendor-motion": ["framer-motion"],
          "vendor-router": ["react-router-dom"],
        },
      },
    },
  },
});
