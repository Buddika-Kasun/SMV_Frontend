import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { BRAND } from "./src/config/brand";

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
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: ["favicon.ico", "apple-touch-icon.png"],
        manifest: {
          name: `${BRAND.shortName}`,
          short_name: `${BRAND.shortName}`,
          description:
            `${BRAND.tagline} Management Enterprise Portal — Loans, KYC, Payments, and Reports.`,
          theme_color: "#2563eb",
          background_color: "#f8fafc",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/dashboard",
          icons: [
            {
              // src: "/pwa-192x192.png",
              src: "/web-app-manifest-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              // src: "/pwa-512x512.png",
              src: "/web-app-manifest-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              // src: "/pwa-maskable-512x512.png",
              src: "/web-app-manifest-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Don't cache API calls — always hit the server
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/api\/.*/i,
              handler: "NetworkOnly",
            },
          ],
          // Cache static assets
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
        devOptions: {
          // Enable PWA in dev so the install button shows up locally
          enabled: true,
          type: "module",
        },
      }),
    ],
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
