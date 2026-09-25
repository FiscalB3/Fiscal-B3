import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const api = "http://127.0.0.1:3001";

export default defineConfig({
  plugins: [react()],
  root: "src/interface/web",
  server: {
    proxy: {
      "/health": api,
      "/portfolio": api,
      "/dashboard": api,
      "/timeline": api,
      "/darf-calendar": api,
      "/darf-breakdown": api,
      "/modality-breakdown": api,
      "/loss-carryforward": api,
      "/year-comparison": api,
      "/insights": api,
      "/portfolio-cost-evolution": api,
      "/simulate-sale": api,
      "/apuration": api,
      "/declaration": api,
      "/declaration.csv": api,
      "/imports": api,
      "/demo": api,
    },
  },
  build: {
    outDir: "../../../dist/web",
    emptyOutDir: true,
  },
});
