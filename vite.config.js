import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 8081, strictPort: true },
  preview: { port: 8081, strictPort: true },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 utilise encore @import et d'anciennes fonctions Sass :
        // on masque ces avertissements de dépréciation qui ne nous concernent pas.
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
    css: false,
    // Firebase est initialisé en mode émulateurs pendant les tests (aucune connexion réseau).
    env: { VITE_USE_EMULATORS: 'true' },
  },
});
