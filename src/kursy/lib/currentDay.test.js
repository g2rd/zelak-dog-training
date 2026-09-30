import { describe, expect, it } from 'vitest'
import {
  currentDay,
  dayStats,
  daysUntil,
  formatDate,
  isDayDone,
  isDayUnlocked,
  startOfDay,
  unlockDate,
} from '@/kursy/lib/currentDay'

/**
 * Daty budujemy względem „teraz", a nie z zapisanych na sztywno łańcuchów.
 *
 * Powód: `currentDay` liczy z LOKALNEJ daty urządzenia. Test z wpisanym
 * `'2026-09-16'` przechodziłby w Polsce, a wywracał się na maszynie CI
 * ustawionej na UTC albo na czas amerykański — bo ten łańcuch jest parsowany
 * jako północ UTC i w innej strefie wypada poprzedniego dnia. Liczenie od
 * dzisiaj daje ten sam wynik wszędzie.
 */
function dniTemu(n) {
  const d = new Date()
  d.setHours(12, 0, 0, 0) // południe: bezpieczny margines na zmianę czasu
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

describe('currentDay', () => {
  it('pierwszego dnia kursu zwraca 1', () => {
    expect(currentDay(dniTemu(0), 60)).toBe(1)
  })

  it('nazajutrz zwraca 2', () => {
    expect(currentDay(dniTemu(1), 60)).toBe(2)
  })

  it('po 11 dniach zwraca 12', () => {
    expect(currentDay(dniTemu(11), 60)).toBe(12)
  })

  it('nie przekracza długości kursu', () => {
    expect(currentDay(dniTemu(500), 60)).toBe(60)
  })

  it('nigdy nie schodzi poniżej 1, nawet dla daty z przyszłości', () => {
    expect(currentDay(dniTemu(-5), 60)).toBe(1)
  })
})

describe('unlockDate', () => {
  it('dzień 1 odblokowuje się w dniu startu', () => {
    const start = dniTemu(0)
    expect(unlockDate(start, 1).getTime()).toBe(startOfDay(start).getTime())
  })

  it('dzień 10 odblokowuje się 9 dni po starcie', () => {
    const start = dniTemu(0)
    expect(daysUntil(unlockDate(start, 10))).toBe(9)
  })
})

describe('daysUntil', () => {
  it('dla dzisiaj zwraca 0', () => {
    expect(daysUntil(new Date())).toBe(0)
  })

  it('dla przeszłości zwraca wartość ujemną', () => {
    expect(daysUntil(dniTemu(3))).toBe(-3)
  })
})

describe('isDayUnlocked', () => {
  const dzienPlatny = { day_number: 10, is_free_preview: false }
  const ostatni = { day_number: 60, is_free_preview: false }
  const dzienDarmowy = { day_number: 1, is_free_preview: true }

  it('darmowa próbka jest otwarta nawet bez wykupionego dostępu', () => {
    expect(isDayUnlocked({ hasAccess: false, day: dzienDarmowy })).toBe(true)
  })

  it('bez dostępu płatna lekcja jest zamknięta', () => {
    expect(isDayUnlocked({ hasAccess: false, day: dzienPlatny })).toBe(false)
  })

  /**
   * Reguła zmieniona świadomie 17.09.2026. Wcześniej lekcje otwierały się dzień
   * po dniu, co karało kursanta za wiedzę: ktoś, kto znał materiał pierwszych
   * lekcji i kupił kurs dla czwartej, czekał cztery dni na treść, za którą
   * zapłacił. Lustrzana zmiana jest w funkcji `day_unlocked` w bazie — i to ona
   * decyduje naprawdę, ta tutaj rysuje tylko kłódki.
   */
  it('po zakupie otwarta jest KAŻDA lekcja, także ostatnia', () => {
    expect(isDayUnlocked({ hasAccess: true, day: dzienPlatny })).toBe(true)
    expect(isDayUnlocked({ hasAccess: true, day: ostatni })).toBe(true)
  })

  it('wynik nie zależy od tego, ile dni minęło od zakupu', () => {
    // Argument `current` nie jest już brany pod uwagę. Gdyby ktoś przywrócił
    // dawną logikę, ten test to wychwyci.
    expect(isDayUnlocked({ hasAccess: true, current: 1, day: ostatni })).toBe(true)
    expect(isDayUnlocked({ hasAccess: true, current: 999, day: ostatni })).toBe(true)
  })
})

describe('dayStats i isDayDone', () => {
  const dni = [{ id: 'd1' }, { id: 'd2' }]
  const zadania = [
    { id: 't1', course_day_id: 'd1' },
    { id: 't2', course_day_id: 'd1' },
    { id: 't3', course_day_id: 'd2' },
  ]

  it('liczy zadania i odhaczenia w obrębie dnia', () => {
    const stats = dayStats(dni, zadania, new Set(['t1']))
    expect(stats.get('d1')).toEqual({ total: 2, done: 1 })
    expect(stats.get('d2')).toEqual({ total: 1, done: 0 })
  })

  it('dzień jest zaliczony dopiero po odhaczeniu wszystkich zadań', () => {
    const stats = dayStats(dni, zadania, new Set(['t1', 't2']))
    expect(isDayDone(stats.get('d1'))).toBe(true)
    expect(isDayDone(stats.get('d2'))).toBe(false)
  })

  /**
   * Zabezpieczenie przed cichym błędem: dla dni zablokowanych baza nie zwraca
   * ŻADNYCH zadań (polityka RLS). Gdyby „zero z zera" liczyło się jako komplet,
   * siatka 60 dni pokazywałaby wszystkie zablokowane dni jako zaliczone.
   */
  it('dzień bez widocznych zadań NIE jest zaliczony', () => {
    const stats = dayStats([{ id: 'zablokowany' }], [], new Set())
    expect(isDayDone(stats.get('zablokowany'))).toBe(false)
  })

  it('zadania spoza podanych dni są pomijane', () => {
    const stats = dayStats([{ id: 'd1' }], [{ id: 'x', course_day_id: 'obcy' }], new Set())
    expect(stats.get('d1')).toEqual({ total: 0, done: 0 })
  })
})

describe('formatDate', () => {
  it('formatuje po polsku', () => {
    expect(formatDate(new Date(2026, 8, 17))).toContain('2026')
    expect(formatDate(new Date(2026, 8, 17))).toMatch(/wrze/i)
  })
})
