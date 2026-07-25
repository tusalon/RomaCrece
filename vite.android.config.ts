import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "pages",
  envDir: "..",
  base: "./",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../android-web",
    emptyOutDir: true,
  },
});
