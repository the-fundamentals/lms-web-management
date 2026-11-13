import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Must be first — source inspect, console piping, strip Devtools from production.
    devtools({
      removeDevtoolsOnBuild: true,
      injectSource: { enabled: true },
      consolePiping: {
        enabled: true,
        levels: ["log", "warn", "error", "info", "debug"],
      },
      eventBusConfig: { enabled: true },
    }),
    // Official defaults: routesDirectory ./src/routes, generatedRouteTree ./src/routeTree.gen.ts
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
});
