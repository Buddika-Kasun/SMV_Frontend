import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // loadEnv reads .env files + process.env with the given prefix.
  // The "" prefix disables filtering so we can also read PORT.
  const fileEnv = loadEnv(mode, process.cwd(), "");

  // Prefer process.env (Railway/Docker injects here at runtime),
  // fall back to .env file for local dev.
  const rawAllowedHosts =
    process.env.VITE_ALLOWED_HOSTS ?? fileEnv.VITE_ALLOWED_HOSTS ?? "";

  const allowedHosts = rawAllowedHosts
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const port = Number(process.env.PORT) || Number(fileEnv.PORT) || 3000;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    },
    preview: {
      host: "0.0.0.0",
      port,
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    },
  };
});
