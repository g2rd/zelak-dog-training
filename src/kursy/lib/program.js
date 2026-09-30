/**
 * Czysta logika programu stacjonarnego — bez Reacta i bez Supabase, żeby dało
 * się ją testować w Node.
 */

/** Dni w siatce zadania domowego: tyle, ile kolumn na papierowej karcie. */
export const HOMEWORK_DAYS = [1, 2, 3, 4, 5, 6, 7]

/** Po ilu dniach bez aktywności kursant jest oznaczany jako „przestał". */
export const INACTIVE_AFTER_DAYS = 4

/** Klucz odhaczenia w zbiorze: element + dzień (0 dla list jednorazowych). */
export const logKey = (itemId, day = 0) => `${itemId}:${day}`

/**
 * Dzieli elementy spotkania na trzy listy z karty, w kolejności z karty.
 * @param {Array<{kind: string, position: number}>} items
 */
export function splitItems(items = []) {
  const sorted = [...items].sort((a, b) => a.position - b.position)
  return {
    homework: sorted.filter((i) => i.kind === 'homework'),
    check: sorted.filter((i) => i.kind === 'check'),
    gear: sorted.filter((i) => i.kind === 'gear'),
  }
}

/**
 * Nagłówki list jednorazowych. Na ostatniej karcie nie ma „następnego
 * spotkania", więc lista kontrolna nazywa się tam „Na koniec kursu".
 */
export function checklistHeadings(number, total) {
  if (number >= total) return { check: 'Na koniec kursu', gear: null }
  return {
    check: `Przed spotkaniem ${number + 1} sprawdź`,
    gear: `Zabierz na spotkanie ${number + 1}`,
  }
}

/**
 * Ile kratek siatki zadania domowego jest odhaczonych.
 * @param {Array<{id: string}>} homework
 * @param {Set<string>} done  klucze z `logKey`
 */
export function homeworkStats(homework, done) {
  let count = 0
  for (const item of homework) {
    for (const day of HOMEWORK_DAYS) if (done.has(logKey(item.id, day))) count += 1
  }
  return { done: count, total: homework.length * HOMEWORK_DAYS.length }
}

/**
 * Czy spotkanie jest zaliczone: każda kratka zadania domowego (dni 1–7)
 * i każda pozycja „przed spotkaniem sprawdź”. Lista pakowania się nie liczy.
 * Ta sama zasada co `participant_passed()` w bazie.
 */
export function sessionComplete(session, done) {
  const { homework, check } = splitItems(session.session_items)
  const hw = homeworkStats(homework, done)
  return hw.done === hw.total && check.every((i) => done.has(logKey(i.id, 0)))
}

/**
 * Postęp do odblokowania dalszych spotkań. `freeSessions` = ile pierwszych
 * spotkań jest zawsze otwartych (null = bez blokady).
 * @returns {{ limit: number|null, completed: number[], passed: boolean }}
 */
export function gateProgress(sessions, done, freeSessions) {
  if (!freeSessions) return { limit: null, completed: [], passed: true }
  const required = sessions.filter((s) => s.number <= freeSessions)
  const completed = required.filter((s) => sessionComplete(s, done)).map((s) => s.number)
  return { limit: freeSessions, completed, passed: completed.length === required.length }
}

/** Pełne dni od podanej chwili do teraz; `null`, gdy brak daty. */
export function daysSince(input, now = new Date()) {
  if (!input) return null
  return Math.floor((+now - +new Date(input)) / 86_400_000)
}

/** „dziś", „wczoraj", „3 dni temu", „nigdy". */
export function formatSince(input, now = new Date()) {
  const days = daysSince(input, now)
  if (days === null) return 'brak aktywności'
  if (days <= 0) return 'dziś'
  if (days === 1) return 'wczoraj'
  return `${days} dni temu`
}

/** Kolejność statusów na liście trenera: najpierw to, co wymaga działania. */
const STATUS_ORDER = { pending: 0, approved: 1, finished: 2, rejected: 3 }

/**
 * Sortowanie listy trenera. Oczekujące zgłoszenia na górze; wśród aktywnych
 * NAJDAWNIEJSZA aktywność pierwsza — najcenniejsza informacja to nie to, kto
 * ćwiczy, tylko kto przestał. Brak aktywności liczy się jak najdawniejsza.
 */
export function sortForTrainer(rows) {
  return [...rows].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    if (a.status === 'pending') return +new Date(a.applied_at) - +new Date(b.applied_at)
    const ta = a.last_activity ? +new Date(a.last_activity) : -Infinity
    const tb = b.last_activity ? +new Date(b.last_activity) : -Infinity
    return ta - tb
  })
}

export const STATUS_LABELS = {
  pending: 'Czeka na zatwierdzenie',
  approved: 'W trakcie kursu',
  finished: 'Kurs zakończony',
  rejected: 'Odrzucone',
}

/**
 * Czy dostęp zgłoszenia jeszcze trwa. `null` = bez limitu. Tylko do
 * rysowania ekranu — o dostępie i tak decyduje `access_open()` w bazie.
 */
export function isAccessOpen(expiresAt, now = new Date()) {
  return !expiresAt || +new Date(expiresAt) > +now
}

/**
 * Data przesunięta o `months` miesięcy. Koniec miesiąca się nie przelewa:
 * 31 stycznia + 1 miesiąc to 28 (29) lutego, a nie 3 marca.
 */
export function addMonths(input, months) {
  const d = new Date(input)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return d
}

/**
 * Nowy termin po przedłużeniu o miesiąc: od dotychczasowego terminu, a jeśli
 * już minął — od dziś. Inaczej przedłużenie wygasłego dostępu mogłoby dać
 * termin, który też jest już w przeszłości.
 */
export function extendedExpiry(expiresAt, now = new Date(), months = 1) {
  const base = expiresAt && +new Date(expiresAt) > +now ? new Date(expiresAt) : now
  return addMonths(base, months)
}

/** Kod dostępu do wyświetlenia: `ABCDEFGH` → `ABCD-EFGH`. */
export function formatCode(code = '') {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code
}

/**
 * Stan kodu w panelu trenera.
 * @param {{revoked_at?: string|null, redeemed_at?: string|null}} code
 */
export function codeStatus(code) {
  if (code.revoked_at) return 'revoked'
  if (code.redeemed_at) return 'used'
  return 'free'
}

/** Polskie komunikaty dla błędów z `apply_to_program` i `redeem_access_code`. */
export function applyErrorMessage(error) {
  const text = `${error?.message ?? ''}`
  if (text.includes('invalid_code')) return 'Ten kod nie pasuje. Sprawdź, czy dobrze go przepisujesz.'
  if (text.includes('code_used')) return 'Ten kod został już wykorzystany.'
  if (text.includes('code_email_mismatch'))
    return 'Ten kod jest przypisany do innego adresu e-mail. Zaloguj się kontem założonym na adres, na który dostałeś kod.'
  if (text.includes('already_active')) return 'Ten pies ma już aktywny dostęp. Kod zostaje ważny — zachowaj go na później.'
  if (text.includes('dog_not_found')) return 'Nie znaleziono tego psa na Twoim koncie.'
  if (text.includes('program_not_found')) return 'Ten program nie przyjmuje teraz zgłoszeń.'
  console.error('[program]', error)
  return 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę.'
}
