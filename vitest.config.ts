import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["**/*.integration.test.ts"],
    environment: "jsdom",
    setupFiles: ["src/interface/web/test-setup.ts"],
  },
});
