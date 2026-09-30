/**
 * Ekran widoczny przez ułamek sekundy, gdy przeglądarka pobiera chunk strefy
 * kursów. Świadomie bez importów z `@/kursy/*` — musi być w głównej paczce,
 * inaczej sam czekałby na chunk, który ma zasłaniać.
 */
export function ZoneFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-5 text-center"
    >
      <span className="font-heading text-xl uppercase tracking-wider text-primary">ZELAK</span>
      <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
        Ładowanie strefy kursów…
      </span>
    </div>
  )
}
