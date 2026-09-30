import { cn } from '@/lib/cn'

/** Pasek postępu z etykietą tekstową — czytelny także bez koloru. */
export function ProgressBar({ value, max, label, className }) {
  const safeMax = Math.max(max, 1)
  const percent = Math.round((Math.min(value, safeMax) / safeMax) * 100)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-4">
        {label && (
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">{label}</span>
        )}
        <span className="font-heading text-sm text-primary">
          {value} / {max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={value}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded bg-line"
      >
        <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
