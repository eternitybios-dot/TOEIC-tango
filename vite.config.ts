import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/TOEIC-tango/",
  build: {
    outDir: "docs",
  },
  test: {
    environment: "node",
  },
});
