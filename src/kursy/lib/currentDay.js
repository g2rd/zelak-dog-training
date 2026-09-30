const DAY_MS = 86_400_000

/** Północ lokalnego dnia dla podanej daty. */
export function startOfDay(input) {
  const d = new Date(input)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Który dzień kursu jest „dzisiejszy": dzień 1 to data startu, dzień N to
 * start + N-1 dni. Wynik nigdy nie przekracza długości kursu — po jego
 * zakończeniu użytkownik zostaje na ostatnim dniu i może nadrabiać.
 *
 * Liczone z LOKALNEJ daty urządzenia. Baza (funkcja `day_unlocked`) liczy to
 * samo w strefie Europe/Warsaw, więc dla użytkownika w Polsce oba wyniki się
 * zgadzają. Poza Polską to tylko wygoda UI — o dostępie i tak decyduje RLS.
 *
 * @param {string} startedAt  ISO z `enrollments.started_at`
 * @param {number} durationDays
 */
export function currentDay(startedAt, durationDays) {
  const start = startOfDay(startedAt)
  const today = startOfDay(new Date())
  const diff = Math.floor((+today - +start) / DAY_MS)
  return Math.max(1, Math.min(diff + 1, durationDays))
}

/** Data, od której dzień `dayNumber` jest dostępny. */
export function unlockDate(startedAt, dayNumber) {
  const d = startOfDay(startedAt)
  d.setDate(d.getDate() + dayNumber - 1)
  return d
}

/** Ile pełnych dni zostało do daty (ujemne = już minęła). */
export function daysUntil(dateInput) {
  const target = startOfDay(dateInput)
  const today = startOfDay(new Date())
  return Math.round((+target - +today) / DAY_MS)
}

/**
 * Czy dzień jest dostępny dla użytkownika — lustro funkcji `day_unlocked`
 * w bazie. Służy wyłącznie do rysowania kłódek; brak dostępu egzekwuje RLS.
 *
 * Po zakupie otwarte są WSZYSTKIE lekcje. Wcześniej kurs udostępniał się dzień
 * po dniu, ale to karało kursanta za wiedzę: ktoś, kto opanował materiał
 * pierwszych lekcji i kupił kurs dla czwartej, czekał cztery dni na treść, za
 * którą zapłacił. Tempo pracy z psem zostaje rekomendacją w treści kursu,
 * a nie blokadą w systemie.
 *
 * Kłódka oznacza więc dziś dokładnie jedno: nie masz dostępu do kursu.
 */
export function isDayUnlocked({ hasAccess, day }) {
  if (day.is_free_preview) return true
  return Boolean(hasAccess)
}

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDate(input) {
  return dateFormatter.format(new Date(input))
}

/**
 * Statystyki postępu na dzień: ile zadań, ile odhaczonych.
 * Zadania z dni zablokowanych nie przychodzą z bazy (RLS), więc dla nich
 * `total` = 0 — dzień bez zadań nigdy nie liczy się jako ukończony.
 */
export function dayStats(days, tasks, doneIds) {
  const byDay = new Map(days.map((d) => [d.id, { total: 0, done: 0 }]))
  for (const task of tasks) {
    const stat = byDay.get(task.course_day_id)
    if (!stat) continue
    stat.total += 1
    if (doneIds.has(task.id)) stat.done += 1
  }
  return byDay
}

export function isDayDone(stat) {
  return Boolean(stat) && stat.total > 0 && stat.done === stat.total
}
