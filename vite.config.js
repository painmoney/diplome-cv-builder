import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function todoGuard() {
  let mode;
  return {
    name: "todo-placeholder-guard",
    configResolved(config) {
      mode = config.mode;
    },
    closeBundle() {
      if (mode !== "production") return;
      const distDir = join(process.cwd(), "dist");
      const files = readdirSync(distDir, { recursive: true }).filter((f) => f.endsWith(".js") || f.endsWith(".html"));
      for (const file of files) {
        const content = readFileSync(join(distDir, file), "utf8");
        if (content.includes("TODO_PLACEHOLDER")) {
          throw new Error(`Build failed: TODO_PLACEHOLDER found in ${file}. Fill all placeholders before production build.`);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), todoGuard()],
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
          "vendor-pdf": ["@react-pdf/renderer"],
          "vendor-motion": ["framer-motion"],
          "vendor-router": ["react-router-dom"],
        },
      },
    },
  },
});
