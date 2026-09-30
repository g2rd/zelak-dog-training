import { cn } from '@/lib/cn'

/**
 * Nagłówek sekcji: eyebrow + duży tytuł + opcjonalny opis.
 * `as` pozwala zachować poprawną hierarchię nagłówków (h1 tylko raz na stronie).
 */
export function SectionHeader({
  eyebrow,
  headline,
  description,
  as: Heading = 'h2',
  align = 'left',
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow && (
        <span className="flex items-center gap-3 font-heading text-[11px] uppercase tracking-wider text-muted">
          <span aria-hidden="true" className="h-px w-8 bg-line" />
          {eyebrow}
        </span>
      )}

      <Heading className="max-w-[22ch] text-3xl sm:text-4xl lg:text-5xl">{headline}</Heading>

      {description && (
        <p className="max-w-[58ch] text-base text-secondary">{description}</p>
      )}
    </div>
  )
}
