import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  /*
    `API_ORIGIN` is deliberately not a `VITE_` variable: it is read here, on the
    dev server, and by the /api/v1 edge function in production. The browser only
    ever sees same-origin `/api/v1/...` paths, so the backend host stays out of
    the bundle and out of a visitor's network tab.
  */
  const env = loadEnv(mode, process.cwd(), "");
  const apiOrigin = env.API_ORIGIN?.trim();

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: apiOrigin
      ? {
          "/api/v1": {
            target: apiOrigin.replace(/\/+$/, ""),
            changeOrigin: true,
            secure: true,
          },
        }
      : undefined,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
