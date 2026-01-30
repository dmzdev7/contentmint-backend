import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier"; // 1. Importar
import prettierPlugin from "eslint-plugin-prettier";    // 2. Importar

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "prisma"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin, // 3. Registrar plugin
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "import/order": ["error", { "newlines-between": "always" }],
      "prettier/prettier": "error", // 4. Activar prettier como regla de ESLint
    },
  },
  eslintConfigPrettier // 5. Desactivar reglas de ESLint que choquen con Prettier
);