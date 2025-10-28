import neostandard from "neostandard";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  // Apply neostandard config to all files
  ...neostandard({
    ts: true, // Enable TypeScript support
  }),

  // TypeScript-specific configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // 🎨 Override neostandard stylistic rules to match Prettier settings
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always",
        },
      ],
      "@stylistic/indent": "off", // Turn off - let Prettier handle indentation

      // ⚠️ IMPORTANT: These rules catch missing await keywords
      "@typescript-eslint/no-floating-promises": "error", // Requires promises to be handled
      "@typescript-eslint/no-misused-promises": "error", // Prevents misuse of promises
      "@typescript-eslint/await-thenable": "error", // Ensures await is only used on promises
      "require-await": "off", // Turn off base rule
      "@typescript-eslint/require-await": "off", // Turn off - Fastify plugins often don't need await

      // Additional helpful rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Ignore compiled files and dependencies
  {
    ignores: ["dist/**", "node_modules/**", "*.js"],
  },
];
