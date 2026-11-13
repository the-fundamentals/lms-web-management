import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  resolve: {
    alias: {
      "@": `${root}src`,
    },
  },
  test: {
    environment: "jsdom",
    // Site-wide so a later unit's tests are collected. This unit's run stays `npx vitest run src/components`.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
