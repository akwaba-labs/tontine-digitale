import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Application installable (icône sur l'écran d'accueil) et coquille disponible hors ligne.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Tontine Digitale',
        short_name: 'Tontine',
        description:
          'Gérez votre tontine : membres, calendrier des tours, cotisations et historique.',
        lang: 'fr',
        start_url: '/tableau-de-bord',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#136F47',
        background_color: '#FBF7EF',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // Les pages techniques de Firebase Auth ne passent pas par l'application.
        navigateFallbackDenylist: [/^\/__\//],
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // jsPDF n'est chargé qu'à l'export : inutile de le pré-télécharger.
        globIgnores: ['**/jspdf*', '**/html2canvas*', '**/index.es-*', '**/purify*'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  server: { port: 8081, strictPort: true },
  preview: { port: 8081, strictPort: true },
  build: {
    // Firebase (Auth + Firestore) pèse ~200 Ko compressés : inévitable, mis en cache par la PWA.
    chunkSizeWarningLimit: 800,
  },
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
    include: ['src/**/*.test.{js,jsx}', 'functions/src/**/*.test.js'],
    setupFiles: ['./src/test/setup.js'],
    css: false,
    // Firebase est initialisé en mode émulateurs pendant les tests (aucune connexion réseau).
    env: { VITE_USE_EMULATORS: 'true' },
  },
});
