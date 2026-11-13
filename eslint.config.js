// Feature import boundary (architecture skill). Enforce with:
//   npx eslint "src/features/**/*.{ts,tsx}"
// when eslint + eslint-plugin-import are installed for the project.
/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/features/auth",
              from: [
                "./src/features/classroom",
                "./src/features/app-shell",
                "./src/features/members",
                "./src/features/schedule",
                "./src/features/payment",
              ],
              message:
                "A feature must not import another feature. Move shared code to src/shared.",
            },
            {
              target: "./src/features/classroom",
              from: [
                "./src/features/auth",
                "./src/features/app-shell",
                "./src/features/members",
                "./src/features/schedule",
                "./src/features/payment",
              ],
              message:
                "A feature must not import another feature. Move shared code to src/shared.",
            },
            {
              target: "./src/features/app-shell",
              from: [
                "./src/features/auth",
                "./src/features/classroom",
                "./src/features/members",
                "./src/features/schedule",
                "./src/features/payment",
              ],
              message:
                "A feature must not import another feature. Move shared code to src/shared.",
            },
            {
              target: "./src/features/members",
              from: [
                "./src/features/auth",
                "./src/features/classroom",
                "./src/features/app-shell",
                "./src/features/schedule",
                "./src/features/payment",
              ],
              message:
                "A feature must not import another feature. Move shared code to src/shared.",
            },
            {
              target: "./src/features/schedule",
              from: [
                "./src/features/auth",
                "./src/features/classroom",
                "./src/features/app-shell",
                "./src/features/members",
                "./src/features/payment",
              ],
              message:
                "A feature must not import another feature. Move shared code to src/shared.",
            },
            {
              target: "./src/features/payment",
              from: [
                "./src/features/auth",
                "./src/features/classroom",
                "./src/features/app-shell",
                "./src/features/members",
                "./src/features/schedule",
              ],
              message:
                "A feature must not import another feature. Move shared code to src/shared.",
            },
          ],
        },
      ],
    },
  },
];
