import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

/**
 * Konfiguracja testów — celowo osobna od `vite.config.js`.
 *
 * Gdyby testy korzystały z konfiguracji builda, uruchamiałaby się przy nich
 * wtyczka PWA: generowałaby service workera i manifest przy każdym przebiegu.
 * Testom to niepotrzebne, a spowalnia i zaśmieca wynik.
 *
 * Środowisko `node`, nie `jsdom`. Testujemy czystą logikę — liczenie dnia
 * kursu, tłumaczenie błędów, spójność listy adresów strefy. Nic z tego nie
 * dotyka DOM, więc udawanie przeglądarki byłoby kosztem bez korzyści.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    reporters: 'default',
  },
})
