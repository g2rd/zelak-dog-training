import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Pasek dziesięciu spotkań nad kartą: gdzie kursant jest i które karty już
 * za nim. Spotkania po bieżącym są wyciszone; spotkania z `open: false`
 * mają kłódkę i prowadzą do ekranu z wyjaśnieniem, jak je otworzyć.
 *
 * @param {{ id: string, number: number, title: string, open?: boolean }[]} sessions
 * @param {(n: number) => string} linkTo  adres karty spotkania `n`
 */
export function SessionStrip({ sessions, current, active, linkTo }) {
  const scroller = useRef(null)

  // Na telefonie dziesięć kwadratów się nie mieści i pasek się przewija.
  // Oglądana karta ma być widoczna bez szukania, np. spotkanie 8.
  // `scrollLeft`, nie `scrollIntoView` — to drugie przewija też całą stronę.
  useEffect(() => {
    const box = scroller.current
    const link = box?.querySelector('[aria-current="page"]')
    if (!box || !link) return
    box.scrollLeft = link.offsetLeft - box.clientWidth / 2 + link.offsetWidth / 2
  }, [active])

  return (
    // `relative`, bo ukryte etykiety `sr-only` są pozycjonowane absolutnie:
    // bez pozycjonowanego przodka uciekają z przewijanego paska i poszerzają
    // całą stronę na telefonie.
    <nav ref={scroller} aria-label="Spotkania kursu" className="relative -mx-1 overflow-x-auto pb-1">
      <ol className="flex min-w-max gap-1 px-1">
        {sessions.map((s) => {
          const isActive = s.number === active
          const isPast = s.number < current
          const isCurrent = s.number === current
          if (s.open === false) {
            return (
              <li key={s.id}>
                <Link
                  to={linkTo(s.number)}
                  aria-current={isActive ? 'page' : undefined}
                  title={`${s.title} — zablokowane`}
                  className={cn(
                    'flex h-11 w-11 flex-col items-center justify-center rounded border border-dashed font-heading text-[11px] text-muted',
                    isActive ? 'border-primary text-primary' : 'border-line',
                  )}
                >
                  <Lock aria-hidden="true" className="h-3 w-3" />
                  <span className="sr-only">Spotkanie </span>
                  {s.number}
                  <span className="sr-only"> (zablokowane)</span>
                </Link>
              </li>
            )
          }
          return (
            <li key={s.id}>
              <Link
                to={linkTo(s.number)}
                aria-current={isActive ? 'page' : undefined}
                title={s.title}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded border font-heading text-sm transition-colors',
                  isActive && 'border-primary bg-primary text-ink',
                  !isActive && isCurrent && 'border-primary text-primary',
                  !isActive && isPast && 'border-line text-secondary hover:border-primary',
                  !isActive && !isPast && !isCurrent && 'border-line text-muted/60 hover:text-primary',
                )}
              >
                <span className="sr-only">Spotkanie </span>
                {s.number}
                {isCurrent && <span className="sr-only"> (bieżące)</span>}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
