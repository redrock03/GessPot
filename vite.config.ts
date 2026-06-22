import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// API_BASE (proxy מול ישיר) — נקודת התצורה היחידה שנוגעת בהחלטת ה-CORS (CLAUDE.md §7/§17).
// base: GitHub Pages מגיש תחת /GessPot/ ; פיתוח/אירוח-שורש — '/'. ניתן לעקיפה דרך VITE_BASE.

export default defineConfig(({ command }) => {
  // build → GitHub Pages תחת /GessPot/ ; dev → '/'. לאירוח-שורש אחר: שנו ל-'/'.
  const base = command === 'build' ? '/GessPot/' : '/';
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
        manifest: {
          name: 'GessPot',
          short_name: 'GessPot',
          description: 'מוצר משלים ל-PTDIAL',
          lang: 'he',
          dir: 'rtl',
          theme_color: '#0b1020',
          background_color: '#0b1020',
          display: 'standalone',
          orientation: 'portrait',
          start_url: base,
          scope: base,
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        },
        devOptions: { enabled: true },
      }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  };
});
