// import tailwindcss from '@tailwindcss/vite';
// import react from '@vitejs/plugin-react';
// import path from 'path';
// import {defineConfig} from 'vite';

// export default defineConfig(() => {
//   return {
//     plugins: [react(), tailwindcss()],
//     resolve: {
//       alias: {
//         '@': path.resolve(__dirname, '.'),
//       },
//     },
//     server: {
//       // HMR is disabled in AI Studio via DISABLE_HMR env var.
//       // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
//       hmr: process.env.DISABLE_HMR !== 'true',
//       // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
//       watch: process.env.DISABLE_HMR === 'true' ? null : {},
//     },
//   };
// });

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load all env vars (3rd arg "" disables the VITE_ prefix filter,
  // so we can also read PORT from the platform)
  const env = loadEnv(mode, process.cwd(), "");

  const allowedHosts = (env.VITE_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
      // Allow custom hosts in dev (also picked up here)
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    },
    preview: {
      host: "0.0.0.0",
      port: Number(env.PORT) || 3000,
      // Allow the Railway domain (and any *.up.railway.app subdomain)
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    },
  };
});