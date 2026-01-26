import js from '@eslint/js'
import react from 'eslint-plugin-react'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    {
        ignores: ['**/node_modules/**', '**/dist/**'],
    },
    js.configs.recommended,
    {
        files: ['**/*.tsx'],
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {jsx: true},
                ecmaVersion: "latest",
                sourceType: 'module',
            },
        },
        plugins: {react},
        settings: {
            react: {version: 'detect'},
        },
    },
    {
        files: ['**/*.{js,mjs,ts}'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.mocha,
                ...globals.chai
            },
            parser: tsParser,
            parserOptions: {
                ecmaFeatures: {jsx: true},
                ecmaVersion: "latest",
                sourceType: 'module',
            }
        },
        plugins: {'@typescript-eslint': tseslint},
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/prefer-for-of': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            'no-constant-binary-expression': 'off',
            'no-undef': 'off',
            'no-unused-vars': 'off'
        },
    },
])
