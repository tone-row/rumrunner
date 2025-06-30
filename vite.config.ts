import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "src/ui",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // input block removed
    },
  },
  plugins: [react(), tailwindcss()],
});
