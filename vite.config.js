import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
