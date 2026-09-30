import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { HOMEWORK_DAYS, logKey } from '@/kursy/lib/program'

/**
 * Siatka zadania domowego: ćwiczenie × siedem dni, jak kolumny 1–7 na karcie.
 *
 * DLACZEGO NIE TABELA
 *
 * Plan zakładał tabelę obracaną o ćwierć obrotu na telefonie, bo trzy wiersze
 * po siedem kolumn obok nazwy ćwiczenia ściskają kratki do ~36 px — poniżej
 * progu wygodnego dotyku. Prostsze rozwiązanie: nazwa ćwiczenia NAD rzędem
 * kratek, nie obok, więc rząd dostaje całą szerokość karty. Czyta się tak
 * samo jak papier: wiersz = ćwiczenie.
 *
 * Kratka ma zawsze 44 px wysokości, a szerokość dzieli równo to, co zostaje:
 * 42 px na telefonie 375 px, 39 px na 360 px, pełne 44 px od 400 px w górę.
 * Sztywne 44 × 44 wystawało poza kartę na telefonach węższych niż ~410 px.
 *
 * `onToggle` = null → widok tylko do odczytu (trener, kurs zakończony).
 */
export function HomeworkGrid({ items, done, onToggle }) {
  const readOnly = !onToggle

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const count = HOMEWORK_DAYS.filter((day) => done.has(logKey(item.id, day))).length
        return (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded border border-line bg-surface px-3 py-4 sm:p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-medium text-primary">{item.label}</span>
              <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
                {item.frequency ? `${item.frequency} · ` : ''}
                {count} / 7 dni
              </span>
            </div>

            <div role="group" aria-label={`Dni: ${item.label}`} className="flex gap-[3px] sm:gap-1">
              {HOMEWORK_DAYS.map((day) => {
                const checked = done.has(logKey(item.id, day))
                return (
                  <button
                    key={day}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`Dzień ${day}: ${item.label}`}
                    disabled={readOnly}
                    onClick={() => onToggle?.({ itemId: item.id, day, done: !checked })}
                    className={cn(
                      'relative flex h-11 min-w-0 max-w-11 flex-1 items-center justify-center rounded border font-heading text-[13px] transition-colors sm:w-11 sm:flex-none',
                      checked
                        ? 'border-primary bg-primary text-ink'
                        : 'border-line text-muted',
                      !readOnly && !checked && 'hover:border-primary hover:text-primary',
                      readOnly && 'cursor-default',
                    )}
                  >
                    {checked ? (
                      <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
                    ) : (
                      <span aria-hidden="true">{day}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
