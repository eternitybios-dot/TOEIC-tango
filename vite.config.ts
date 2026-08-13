import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: "./",
  build: {
    outDir: "docs",
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
  test: {
    environment: "node",
  },
});
