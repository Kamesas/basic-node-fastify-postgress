import neostandard from "neostandard";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import promisePlugin from "eslint-plugin-promise";

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
      promise: promisePlugin,
    },
    rules: {
      // 🎨 Override neostandard stylistic rules to match Prettier settings
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "never",
          enums: "always-multiline",
          generics: "always-multiline",
          tuples: "always-multiline",
        },
      ],
      "@stylistic/space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always",
        },
      ],
      "@stylistic/indent": "off", // Turn off - let Prettier handle indentation

      // ⚠️ IMPORTANT: These rules catch missing await keywords and Promise handling
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          ignoreVoid: true,
          ignoreIIFE: false,
        },
      ], // Requires promises to be handled
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: true,
          checksConditionals: true,
          checksSpreads: true,
        },
      ], // Prevents misuse of promises in conditions and spreads
      "@typescript-eslint/await-thenable": "error", // Ensures await is only used on promises
      "@typescript-eslint/promise-function-async": "warn", // Functions returning promises should be async
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        {
          ignoreArrowShorthand: true,
        },
      ], // Prevents confusing void expressions
      "require-await": "off", // Turn off base rule
      "@typescript-eslint/require-await": "off", // Turn off - Fastify plugins often don't need await

      // Promise plugin rules
      "promise/always-return": "off", // Too strict for our use case
      "promise/catch-or-return": "off", // We use async/await
      "promise/valid-params": "error", // Validates Promise constructor params

      // Additional helpful rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // This will catch usage of Promise values as regular values
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },

  // Ignore compiled files and dependencies
  {
    ignores: ["dist/**", "node_modules/**", "*.js"],
  },
];
