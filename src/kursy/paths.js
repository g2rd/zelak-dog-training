/**
 * Pierwsze segmenty adresów należących do strefy kursów.
 *
 * JEDNO źródło prawdy, czytane z trzech miejsc:
 *  - `src/app/App.jsx`       — chowa navbar i stopkę wizytówki w strefie,
 *  - `vite.config.js`        — service worker PWA kieruje te adresy na app.html,
 *  - `scripts/prerender.js`  — wpisy `Disallow` w robots.txt.
 *
 * Czwarte miejsce trzeba zsynchronizować RĘCZNIE: reguła RewriteRule
 * w `public/.htaccess` (sekcja 1a), bo Apache nie czyta JavaScriptu.
 *
 * Plik jest czystym JS bez aliasu `@/`, żeby dało się go zaimportować z Node
 * (vite.config.js, prerender.js) tak samo jak z przeglądarki.
 */
export const ZONE_PREFIXES = [
  'panel',
  'kursy',
  'konto',
  'logowanie',
  'rejestracja',
  'reset-hasla',
  'nowe-haslo',
  'aktywuj',
  'program',
  'trener',
]

/** @param {string} pathname */
export function isZonePath(pathname) {
  const first = pathname.split('/')[1] ?? ''
  return ZONE_PREFIXES.includes(first)
}
