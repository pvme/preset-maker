import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import typescript from "@rollup/plugin-typescript";
import ttsc from "ttypescript";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    typescript({
      typescript: ttsc,
    }),
  ],
});
