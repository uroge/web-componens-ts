import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: { js },
    // https://github.com/eslint/eslint/blob/main/packages/js/src/configs/eslint-recommended.js
    extends: ['js/recommended'],
  },
  tseslint.configs.recommended,
  {
    rules: {
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
      'no-unused-vars': 'warn',
      'no-console': 'error',
    },
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
]);
