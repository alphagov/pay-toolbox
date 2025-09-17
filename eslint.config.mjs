import js from '@eslint/js';
import react from 'eslint-plugin-react';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      'no-unused-vars': 'off',
      'require-atomic-updates': 'off',
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.mocha,
        ...globals.chai,
        cy: 'readonly',
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },
    },
    plugins: { react },
    settings: {
      react: { version: 'detect' },
    },
    files: ['**/*.{js,mjs,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-constant-binary-expression': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];