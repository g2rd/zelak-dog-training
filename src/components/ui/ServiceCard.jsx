import { useId, useState } from 'react'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { scrollToSection } from '@/utils/scrollToSection'

/**
 * Karta usługi.
 *
 * Na wąskich ekranach działa jak akordeon: widoczny jest sam nagłówek,
 * szczegóły rozwijają się po kliknięciu. Od breakpointu `lg` wzwyż karta
 * jest zawsze rozwinięta, a przycisk rozwijania znika — decyduje o tym
 * sam CSS (`hidden lg:flex` / `lg:hidden`), więc nie potrzeba nasłuchu
 * media query ani stanu zależnego od szerokości okna.
 *
 * Hover podświetla obramowanie (animations.cards.hover).
 */
export function ServiceCard({ service, className }) {
  const { title, subtitle, description, features, price, cta } = service
  const [open, setOpen] = useState(false)
  const panelId = `service-${useId()}`

  return (
    <article
      className={cn(
        'group flex h-full flex-col rounded border border-line bg-surface',
        'transition-colors duration-300 hover:border-primary',
        'p-5 sm:p-7 lg:p-8',
        className,
      )}
    >
      {/* Nagłówek — na mobile jest przyciskiem rozwijającym kartę. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start justify-between gap-4 text-left lg:pointer-events-none"
      >
        <span className="flex flex-col gap-1.5">
          <span className="font-heading text-xl uppercase tracking-heading lg:text-2xl">
            {title}
          </span>
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
            {subtitle}
          </span>
        </span>

        <ChevronDown
          aria-hidden="true"
          className={cn(
            'mt-1 h-5 w-5 shrink-0 text-secondary transition-transform duration-300 lg:hidden',
            open && 'rotate-180',
          )}
        />
        <span className="sr-only lg:hidden">
          {open ? 'Zwiń szczegóły' : 'Rozwiń szczegóły'} — {title}
        </span>
      </button>

      {/* Szczegóły — schowane na mobile do czasu rozwinięcia, zawsze widoczne od lg. */}
      <div
        id={panelId}
        className={cn(
          'flex-col gap-6 pt-6',
          open ? 'flex' : 'hidden',
          'lg:flex lg:pt-6',
        )}
      >
        <p className="text-[15px] text-secondary">{description}</p>

        <ul className="flex flex-col gap-2.5 border-t border-line pt-6">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-[15px] text-secondary">
              <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
          {/* Podwójny warunek celowo: sama flaga `visible` nie wystarcza.
              Gdyby ktoś przestawił ją na true, zanim wpisze kwotę, na stronę
              trafiłby pusty albo szablonowy cennik. */}
          {price?.visible && price.value && (
            <span className="font-heading text-lg uppercase tracking-heading">{price.value}</span>
          )}

          <a
            href={cta.target}
            onClick={(event) => {
              if (scrollToSection(cta.target)) event.preventDefault()
            }}
            className="inline-flex items-center gap-2 font-heading text-[12px] uppercase tracking-wider text-primary transition-opacity hover:opacity-70"
          >
            {cta.label}
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            />
            <span className="sr-only"> — {title}</span>
          </a>
        </div>
      </div>
    </article>
  )
}
