import eslint from '@eslint/js'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    {
        ignores: ['**/node_modules/**', '**/dist/**'],
    },
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
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
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        files: ['**/*.{js,mjs,ts}'],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.mocha,
                ...globals.chai
            },
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: 'module',
                projectService: true
            }
        },

        rules: {
            '@typescript-eslint/no-require-imports': 'off', // required for .js files as they use require() for imports
            '@typescript-eslint/no-explicit-any': 'off' // lot of places use type `any`. Need to define proper types before removing this rule
        },
    },
])
