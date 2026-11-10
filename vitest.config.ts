import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

// Screen modules import shadcn from src/components/ui. That folder belongs to
// u0-design-system and is not created here. These aliases exist only so this
// unit's tests can render. The app will not resolve the screens until u0 exists.
export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  resolve: {
    alias: [
      {
        find: "@/components/ui/skeleton",
        replacement: `${root}src/shared/ui/test-doubles/skeleton.tsx`,
      },
      {
        find: "@/components/ui/alert",
        replacement: `${root}src/shared/ui/test-doubles/alert.tsx`,
      },
      {
        find: "@/components/ui/button",
        replacement: `${root}src/shared/ui/test-doubles/button.tsx`,
      },
    ],
  },
  test: {
    environment: "jsdom",
    // Site-wide so a later unit's tests are collected. This unit's run stays `npx vitest run src/shared`.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
