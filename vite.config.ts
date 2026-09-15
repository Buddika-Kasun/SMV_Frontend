import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
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
    // Allow custom hosts during dev too
    allowedHosts: ["localhost", "127.0.0.1", ".up.railway.app"],
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 3000,
    // Hardcoded — Railway domain + any *.up.railway.app subdomain + localhost
    allowedHosts: [
      "smv-finance.up.railway.app",
      ".up.railway.app",
      "localhost",
      "127.0.0.1",
    ],
  },
});
