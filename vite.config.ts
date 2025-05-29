import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/ui",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // input block removed
    },
  },
  plugins: [react()],
});
