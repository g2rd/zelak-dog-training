import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// isSsrBuild = przebieg dla prerenderingu (npm run build, drugi krok).
// Podział na chunki dotyczy wyłącznie builda dla przeglądarki — przy SSR
// react i react-dom są zewnętrzne, więc manualChunks by go wywrócił.
// Z tego samego powodu wtyczka PWA działa tylko w buildzie klienckim:
// service worker jest bytem przeglądarki i przy SSR nie ma czego obsługiwać.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    ...(isSsrBuild
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon-32.png', 'favicon.png', 'robots.txt'],
            manifest: {
              name: 'Zelak — Trening psa',
              short_name: 'Zelak',
              description:
                'Codzienny plan treningu psa: zadania, filmy i checklista postępu.',
              lang: 'pl',
              // Aplikacja zainstalowana z ikony startuje w strefie kursów,
              // a nie na stronie ofertowej — to jej jedyny sens.
              start_url: '/panel',
              scope: '/',
              display: 'standalone',
              orientation: 'portrait',
              theme_color: '#FAFAF9',
              background_color: '#FAFAF9',
              icons: [
                { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: '/icons/512-maskable.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              /*
               * Do pamięci podręcznej trafiają WYŁĄCZNIE zasoby statyczne —
               * żadnego HTML-a.
               *
               * Powód: pliki HTML powstają dopiero po buildzie, w
               * scripts/prerender.js. Gdyby service worker zapisał je na tym
               * etapie, przechowywałby wersje SPRZED prerenderingu — czyli
               * pustą stronę bez treści. Nawigacje idą więc do sieci, tak jak
               * przed wprowadzeniem PWA.
               */
              globPatterns: ['**/*.{js,css,woff2,png,webp,svg,ico}'],
              // Odpowiedzi Supabase ani strumienia wideo nie wolno cache'ować:
              // pierwsze są prywatne i zmienne, drugie zabiłyby limit miejsca.
              runtimeCaching: [],
              navigateFallback: null,
              cleanupOutdatedCaches: true,
            },
            devOptions: {
              // W trybie deweloperskim service worker tylko przeszkadza —
              // podmienia moduły spod HMR-a na wersje z cache.
              enabled: false,
            },
          }),
        ]),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: isSsrBuild
      ? {}
      : {
          output: {
            /*
             * Forma FUNKCYJNA, nie lista pakietów — i to nie jest kwestia gustu.
             *
             * Zapis `{ react: ['react', 'react-dom', 'react-router-dom'] }`
             * obejmuje tylko główne moduły tych pakietów. Runtime JSX
             * (`react/jsx-runtime`) jest osobnym wejściem i do żadnej grupy nie
             * trafiał, więc Rollup dokleił go do chunku ze strefą kursów — jako
             * moduł współdzielony. Skutkiem było `modulepreload` chunku strefy
             * w `index.html`: każdy odwiedzający stronę ofertową pobierał
             * 382 kB supabase-js i React Query, żeby dostać funkcję `jsx`.
             * Dopisanie 'react/jsx-runtime' do listy nic nie dało — Vite po
             * cichu ignoruje wpisy, których nie umie rozwiązać.
             *
             * Dopasowanie po ŚCIEŻCE modułu jest odporne na takie niespodzianki:
             * `node_modules/react/jsx-runtime.js` i wszystkie pliki z
             * `node_modules/react/cjs/` wpadają do tej samej grupy co React.
             *
             * Reszta zależności nie potrzebuje żadnej reguły. Moduły osiągalne
             * wyłącznie przez `import()` (supabase-js, React Query,
             * react-markdown) Rollup sam zostawia w chunku strefy.
             */
            manualChunks(id) {
              const normalized = id.replace(/\\/g, '/')
              if (/\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(normalized)) {
                return 'react'
              }
              return undefined
            },
          },
        },
  },
}))
