import { lazy } from 'react'

/**
 * Leniwe ładowanie strefy kursów — JEDEN chunk dla całej strefy.
 *
 * Każde wywołanie `lazyZone('NazwaKomponentu')` importuje ten sam moduł
 * `@/kursy/index` i wyciąga z niego jeden eksport. Vite widzi jeden import
 * dynamiczny, więc supabase-js, React Query i react-markdown lądują w jednym
 * pliku, pobieranym dopiero po wejściu na /panel, /kursy, /logowanie itd.
 *
 * Dlaczego to nie łamie zasady „bez React.lazy" z routes.jsx: tamta zasada
 * dotyczy tras PRERENDEROWANYCH (renderToString nie umie czekać na chunk).
 * Strefa kursów nie jest i nie może być prerenderowana — treść zależy od
 * zalogowanego użytkownika, a adresy są ukryte przed robotami (noindex,
 * robots.txt). Wizytówka zostaje lekka: odwiedzający strony głównej nie
 * pobiera ani bajta z tej strefy.
 */
const load = () => import('@/kursy/index')

export function lazyZone(name) {
  return lazy(() => load().then((mod) => ({ default: mod[name] })))
}
