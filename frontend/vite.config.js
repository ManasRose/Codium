import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://codium-backend.onrender.com", // Your new live server
        changeOrigin: true,
      },
    },
  },
});
