import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import typescript from "@rollup/plugin-typescript";
import ttsc from "ttsc";
import dns from "dns";
import path from 'path';

dns.setDefaultResultOrder('verbatim');

// https://vitejs.dev/config/
export default defineConfig({
  base: "/preset-maker/",
  plugins: [
    react(),
    typescript({
      typescript: ttsc,
    }),
  ],
  resolve: {
    alias: {
      fs: path.resolve(__dirname, "utility/empty-module.js"),
      path: path.resolve(__dirname, "utility/empty-module.js"),
      url: path.resolve(__dirname, "utility/empty-module.js"),
      'source-map-js': path.resolve(__dirname, "utility/empty-module.js"),
    },
  },
  server: {
    host: 'localhost',
    port: 3000,
  },
});
