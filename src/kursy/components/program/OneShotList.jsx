import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { logKey } from '@/kursy/lib/program'

/**
 * Lista odhaczana jednorazowo: „Przed spotkaniem sprawdź" i „Zabierz na
 * spotkanie". Cały wiersz jest przyciskiem — na spacerze łatwiej trafić
 * w szeroki pas niż w mały kwadrat.
 */
export function OneShotList({ items, done, onToggle }) {
  const readOnly = !onToggle

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const checked = done.has(logKey(item.id, 0))
        return (
          <li key={item.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              disabled={readOnly}
              onClick={() => onToggle?.({ itemId: item.id, day: 0, done: !checked })}
              className={cn(
                'flex min-h-[48px] w-full items-center gap-3 rounded border bg-surface px-3 py-2 text-left transition-colors',
                checked ? 'border-primary' : 'border-line',
                !readOnly && 'hover:border-primary',
                readOnly && 'cursor-default',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded border',
                  checked ? 'border-primary bg-primary text-ink' : 'border-line text-transparent',
                )}
              >
                <Check className="h-4 w-4" strokeWidth={2.6} />
              </span>
              <span
                className={cn(
                  'text-[15px] text-primary',
                  checked && 'text-muted line-through',
                )}
              >
                {item.label}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
