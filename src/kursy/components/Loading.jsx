import { cn } from '@/lib/cn'

/** Neutralny stan ładowania — tekst zamiast spinnera, zgodnie z resztą strony. */
export function Loading({ label = 'Ładowanie…', className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-[40vh] items-center justify-center font-heading text-[12px] uppercase tracking-wider text-muted',
        className,
      )}
    >
      {label}
    </div>
  )
}
