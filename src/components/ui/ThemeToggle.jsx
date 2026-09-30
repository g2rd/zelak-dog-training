import { Moon, MonitorSmartphone, Sun } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTheme, THEME_LABELS } from '@/hooks/useTheme'

const ICONS = {
  dark: Moon,
  light: Sun,
  system: MonitorSmartphone,
}

/* Podpowiedź mówi, co się stanie po kliknięciu — kolejność musi odpowiadać
   THEME_ORDER w useTheme.js (jasny → ciemny → systemowy). */
const NEXT_HINT = {
  light: 'Przełącz na motyw ciemny',
  dark: 'Przełącz na motyw wg ustawień systemu',
  system: 'Przełącz na motyw jasny',
}

/**
 * Przełącznik motywu: jasny → ciemny → systemowy → jasny.
 *
 * Trzy stany, nie dwa. Przy dwóch nie da się wrócić do „rób tak, jak mam
 * ustawione w systemie" — raz kliknięty przełącznik zostaje na zawsze.
 *
 * Dostępność: nazwa przycisku mówi, co się stanie po kliknięciu, a nie jaki
 * stan jest teraz — samą ikonę czytnik ekranu pomija (aria-hidden).
 * aria-live informuje o zmianie bez przenoszenia fokusu.
 */
export function ThemeToggle({ className, withLabel = false }) {
  const { policy, cycle, mounted } = useTheme()
  const Icon = ICONS[policy]

  return (
    <button
      type="button"
      onClick={cycle}
      title={NEXT_HINT[policy]}
      aria-label={NEXT_HINT[policy]}
      className={cn(
        'flex h-11 items-center justify-center gap-3 rounded border border-line text-primary transition-colors hover:bg-primary hover:text-ink',
        withLabel ? 'w-full px-5' : 'w-11',
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.6} />
      {withLabel && (
        <span className="font-heading text-[12px] uppercase tracking-wider">
          {THEME_LABELS[policy]}
        </span>
      )}
      {/* Komunikat dla czytnika ekranu — pusty do czasu hydratacji, żeby nie
          ogłaszać stanu, którego użytkownik jeszcze nie zmienił. */}
      <span className="sr-only" role="status" aria-live="polite">
        {mounted ? THEME_LABELS[policy] : ''}
      </span>
    </button>
  )
}
