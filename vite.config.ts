import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "src/interface/web",
  server: {
    proxy: {
      "/health": "http://127.0.0.1:3001",
      "/portfolio": "http://127.0.0.1:3001",
      "/apuration": "http://127.0.0.1:3001",
      "/declaration": "http://127.0.0.1:3001",
      "/imports": "http://127.0.0.1:3001",
    },
  },
  build: {
    outDir: "../../../dist/web",
    emptyOutDir: true,
  },
});
