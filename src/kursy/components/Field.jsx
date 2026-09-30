import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Pole formularza: etykieta + input + opis/błąd.
 * Rozmiar tekstu 16 px jest celowy — mniejszy sprawia, że iOS Safari
 * przybliża stronę po dotknięciu pola.
 */
export function Field({
  label,
  hint,
  error,
  className,
  inputClassName,
  id: idProp,
  as: Tag = 'input',
  ...inputProps
}) {
  const generated = useId()
  const id = idProp ?? `field-${generated}`
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="font-heading text-[11px] uppercase tracking-wider text-muted">
        {label}
        {inputProps.required && (
          <span aria-hidden="true" className="ml-1 text-secondary">
            *
          </span>
        )}
      </label>
      <Tag
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded border border-line bg-surface px-4 text-base text-primary',
          'placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none',
          Tag === 'textarea' ? 'min-h-[120px] py-3' : 'h-12',
          error && 'border-primary',
          inputClassName,
        )}
        {...inputProps}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-primary">
          {error}
        </p>
      )}
    </div>
  )
}

/** Checkbox z etykietą po prawej — używany do zgód. */
export function CheckboxField({ label, className, id: idProp, ...inputProps }) {
  const generated = useId()
  const id = idProp ?? `check-${generated}`
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 text-[15px] text-secondary', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-line accent-primary"
        {...inputProps}
      />
      <span>{label}</span>
    </label>
  )
}
