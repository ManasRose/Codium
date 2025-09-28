import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all requests starting with /api to your backend server
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        // Rewrite the path: remove '/api' at the start
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
