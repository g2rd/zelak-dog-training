import { useEffect, useId, useRef, useState } from 'react'

const SAVE_DELAY_MS = 1200

/**
 * Notatki kursanta do spotkania, zapisywane same po chwili bez pisania
 * i przy opuszczeniu pola. Bez przycisku „Zapisz" — na telefonie łatwo
 * o nim zapomnieć, a notatka to nie formularz.
 *
 * `onSave` = null → tylko do odczytu (trener, kurs zakończony).
 */
export function NotesField({ initial = '', onSave, saving, error, label = 'Moje notatki' }) {
  const id = useId()
  const [value, setValue] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const timer = useRef(null)
  const latest = useRef(value)
  latest.current = value

  // `initial` czytamy tylko przy montowaniu. Rodzic daje `key={session.id}`
  // i renderuje pole dopiero po wczytaniu notatek — dzięki temu odświeżenie
  // danych po zapisie nie nadpisze tekstu, który ktoś właśnie dopisuje.
  useEffect(() => () => clearTimeout(timer.current), [])

  if (!onSave) {
    return (
      <div className="flex flex-col gap-2">
        <span className="font-heading text-[11px] uppercase tracking-wider text-muted">{label}</span>
        <p className="whitespace-pre-wrap rounded border border-line bg-surface p-4 text-[15px] text-secondary">
          {initial || 'Brak notatek.'}
        </p>
      </div>
    )
  }

  const flush = () => {
    clearTimeout(timer.current)
    if (dirty) {
      onSave(latest.current)
      setDirty(false)
    }
  }

  const status = error
    ? 'Nie udało się zapisać — sprawdź połączenie.'
    : saving
      ? 'Zapisuję…'
      : dirty
        ? 'Zmiany niezapisane'
        : 'Zapisane'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="font-heading text-[11px] uppercase tracking-wider text-muted">
          {label}
        </label>
        <span aria-live="polite" className="text-sm text-muted">
          {status}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        maxLength={10000}
        placeholder="Co poszło dobrze, co sprawia trudność, o co chcesz zapytać na zajęciach…"
        onChange={(e) => {
          setValue(e.target.value)
          setDirty(true)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => {
            onSave(latest.current)
            setDirty(false)
          }, SAVE_DELAY_MS)
        }}
        onBlur={flush}
        className="min-h-[120px] w-full rounded border border-line bg-surface px-4 py-3 text-base text-primary placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none"
      />
    </div>
  )
}
