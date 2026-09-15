import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

console.log("[vite-config] BUILD MARKER v2 — file loaded");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  server: {
    hmr: process.env.DISABLE_HMR !== "true",
    watch: process.env.DISABLE_HMR === "true" ? null : {},
    allowedHosts: ["localhost", "127.0.0.1", ".up.railway.app"],
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 3000,
    allowedHosts: [
      "smv-finance.up.railway.app",
      ".up.railway.app",
      "localhost",
      "127.0.0.1",
    ],
  },
});
