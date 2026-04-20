import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const isSingleFile = process.env.VITE_STORAGE === "local";

export default defineConfig({
  plugins: [react(), ...(isSingleFile ? [viteSingleFile()] : [])],
  build: isSingleFile
    ? {
        assetsInlineLimit: Infinity,
        cssCodeSplit: false,
      }
    : {},
  server: {
    port: 5173,
    strictPort: true,
  },
});
