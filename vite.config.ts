import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "src/interface/web",
  server: {
    proxy: {
      "/health": "http://localhost:3000",
      "/portfolio": "http://localhost:3000",
      "/apuration": "http://localhost:3000",
      "/declaration": "http://localhost:3000",
      "/imports": "http://localhost:3000",
    },
  },
  build: {
    outDir: "../../../dist/web",
    emptyOutDir: true,
  },
});
