import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      { extends: true, test: { name: "recognition", environment: "node", include: ["tests/**/*.test.ts"] } },
      { extends: true, test: { name: "dialog", environment: "jsdom", include: ["tests/**/*.test.tsx"] } },
    ],
  },
});
