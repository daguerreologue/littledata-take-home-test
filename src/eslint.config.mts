import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { tseslint },
    languageOptions: { globals: globals.browser },
    // extends: ["js/recommended"],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier'
    ],
    rules: {
      '@typescript-eslint/semi': ['error', 'always'],
      'indent': ['error', 2, { SwitchCase: 1 }],
      '@typescript-eslint/indent': ['error', 2, { SwitchCase: 1 }],
      'no-nested-ternary': 'off',

      'prefer-arrow/prefer-arrow-functions': ['error', {
        disallowPrototype: true,
        singleReturnOnly: false,
        classPropertiesAllowed: false
      }]
    },
  },
  tseslint.configs.recommended,
]);
