import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import typescript from "@rollup/plugin-typescript";
import ttsc from "ttsc";
import dns from "dns";

dns.setDefaultResultOrder('verbatim')

// https://vitejs.dev/config/
export default defineConfig({
  base: "/preset-maker/",
  plugins: [
    react(),
    typescript({
      typescript: ttsc,
    }),
  ],
  // Defaults to 127.0.0.1 which will cause Imgur requests
  // to fail.
  server: {
    host: 'localhost',
    port: 3000
  }
});
