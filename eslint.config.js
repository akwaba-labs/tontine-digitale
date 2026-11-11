import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'emulator-data', '.firebase', 'functions/lib']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Fichiers exécutés par Node : configuration, scripts et tests.
    files: [
      '*.config.js',
      'scripts/**/*.js',
      'functions/**/*.js',
      '**/*.test.{js,jsx}',
      'src/test/**/*.js',
    ],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
]);
