import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const capacitor = mode === "capacitor";
  return {
    plugins: [react()],
    base: capacitor ? "./" : "/TOEIC-tango/",
    build: {
      outDir: capacitor ? "dist" : "docs",
    },
    test: {
      environment: "node",
    },
  };
});
