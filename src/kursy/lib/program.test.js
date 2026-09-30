import { describe, expect, it } from 'vitest'
import {
  addMonths,
  applyErrorMessage,
  checklistHeadings,
  codeStatus,
  extendedExpiry,
  formatCode,
  formatSince,
  gateProgress,
  homeworkStats,
  isAccessOpen,
  logKey,
  sessionComplete,
  sortForTrainer,
  splitItems,
} from '@/kursy/lib/program'

describe('splitItems', () => {
  it('rozdziela trzy listy karty i zachowuje kolejność z karty', () => {
    const items = [
      { id: 'g1', kind: 'gear', position: 1 },
      { id: 'h2', kind: 'homework', position: 2 },
      { id: 'c1', kind: 'check', position: 1 },
      { id: 'h1', kind: 'homework', position: 1 },
    ]
    const { homework, check, gear } = splitItems(items)
    expect(homework.map((i) => i.id)).toEqual(['h1', 'h2'])
    expect(check.map((i) => i.id)).toEqual(['c1'])
    expect(gear.map((i) => i.id)).toEqual(['g1'])
  })
})

describe('checklistHeadings', () => {
  it('odwołuje się do NASTĘPNEGO spotkania, jak na papierowej karcie', () => {
    expect(checklistHeadings(1, 10)).toEqual({
      check: 'Przed spotkaniem 2 sprawdź',
      gear: 'Zabierz na spotkanie 2',
    })
  })

  it('na ostatniej karcie nie zapowiada nieistniejącego spotkania 11', () => {
    expect(checklistHeadings(10, 10)).toEqual({ check: 'Na koniec kursu', gear: null })
  })
})

describe('homeworkStats', () => {
  it('liczy kratki ćwiczenie × dzień, a nie ćwiczenia', () => {
    const homework = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const done = new Set([logKey('a', 1), logKey('a', 2), logKey('c', 7)])
    expect(homeworkStats(homework, done)).toEqual({ done: 3, total: 21 })
  })

  it('pomija odhaczenia list jednorazowych (dzień 0)', () => {
    expect(homeworkStats([{ id: 'a' }], new Set([logKey('a', 0)]))).toEqual({ done: 0, total: 7 })
  })
})

describe('formatSince', () => {
  const now = new Date('2026-09-23T18:00:00Z')

  it.each([
    [null, 'brak aktywności'],
    ['2026-09-23T08:00:00Z', 'dziś'],
    ['2026-09-22T08:00:00Z', 'wczoraj'],
    ['2026-09-18T08:00:00Z', '5 dni temu'],
  ])('%s → %s', (input, expected) => {
    expect(formatSince(input, now)).toBe(expected)
  })
})

describe('sortForTrainer', () => {
  it('oczekujące na górze, potem ten, kto najdawniej coś odhaczył', () => {
    const rows = [
      { id: 'aktywny', status: 'approved', last_activity: '2026-09-22T10:00:00Z' },
      { id: 'po-kursie', status: 'finished', last_activity: '2026-01-01T10:00:00Z' },
      { id: 'zamilkl', status: 'approved', last_activity: '2026-09-15T10:00:00Z' },
      { id: 'nowy', status: 'pending', applied_at: '2026-09-23T10:00:00Z' },
      { id: 'nigdy', status: 'approved', last_activity: null },
    ]
    expect(sortForTrainer(rows).map((r) => r.id)).toEqual([
      'nowy',
      'nigdy',
      'zamilkl',
      'aktywny',
      'po-kursie',
    ])
  })
})

describe('applyErrorMessage', () => {
  it('tłumaczy zły kod na komunikat z podpowiedzią', () => {
    expect(applyErrorMessage({ message: 'invalid_code' })).toMatch(/kod nie pasuje/)
  })

  it('odróżnia kod przypisany do innego adresu od zużytego', () => {
    expect(applyErrorMessage({ message: 'code_email_mismatch' })).toMatch(/innego adresu/)
    expect(applyErrorMessage({ message: 'code_used' })).toMatch(/już wykorzystany/)
  })
})

describe('isAccessOpen', () => {
  const now = new Date('2026-09-24T12:00:00Z')

  it('brak terminu to dostęp bez limitu', () => {
    expect(isAccessOpen(null, now)).toBe(true)
  })

  it('termin w przyszłości otwiera, w przeszłości zamyka', () => {
    expect(isAccessOpen('2026-12-24T12:00:00Z', now)).toBe(true)
    expect(isAccessOpen('2026-09-24T11:59:59Z', now)).toBe(false)
  })
})

describe('formatCode', () => {
  it('wstawia myślnik w połowie ośmioznakowego kodu', () => {
    expect(formatCode('ABCD2345')).toBe('ABCD-2345')
  })
})

describe('codeStatus', () => {
  it('unieważnienie wygrywa z resztą', () => {
    expect(codeStatus({ revoked_at: 'x', redeemed_at: null })).toBe('revoked')
    expect(codeStatus({ redeemed_at: 'x' })).toBe('used')
    expect(codeStatus({})).toBe('free')
  })
})

describe('addMonths', () => {
  it('nie przelewa końca miesiąca na następny', () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28))
  })

  it('przechodzi przez koniec roku', () => {
    expect(addMonths(new Date(2026, 10, 15), 3)).toEqual(new Date(2027, 1, 15))
  })
})

describe('extendedExpiry', () => {
  const now = new Date(2026, 8, 24)

  it('trwający dostęp wydłuża od dotychczasowego terminu', () => {
    expect(extendedExpiry(new Date(2026, 9, 10), now)).toEqual(new Date(2026, 10, 10))
  })

  it('wygasły dostęp wydłuża od dziś', () => {
    expect(extendedExpiry(new Date(2026, 5, 1), now)).toEqual(new Date(2026, 9, 24))
  })
})

describe('sessionComplete i gateProgress', () => {
  const karta = (number, id) => ({
    number,
    session_items: [
      { id: `${id}-hw`, kind: 'homework', position: 1 },
      { id: `${id}-ch`, kind: 'check', position: 1 },
      { id: `${id}-gear`, kind: 'gear', position: 1 },
    ],
  })
  const wszystko = (id) => [...[1, 2, 3, 4, 5, 6, 7].map((d) => logKey(`${id}-hw`, d)), logKey(`${id}-ch`, 0)]

  it('spotkanie zaliczone bez listy pakowania, niezaliczone bez jednego dnia', () => {
    expect(sessionComplete(karta(1, 'a'), new Set(wszystko('a')))).toBe(true)
    const bezDnia7 = new Set(wszystko('a').filter((k) => k !== logKey('a-hw', 7)))
    expect(sessionComplete(karta(1, 'a'), bezDnia7)).toBe(false)
  })

  it('odblokowanie wymaga zaliczenia wszystkich otwartych spotkań', () => {
    const karty = [karta(1, 'a'), karta(2, 'b'), karta(3, 'c')]
    const polowa = gateProgress(karty, new Set(wszystko('a')), 2)
    expect(polowa).toEqual({ limit: 2, completed: [1], passed: false })
    const calosc = gateProgress(karty, new Set([...wszystko('a'), ...wszystko('b')]), 2)
    expect(calosc.passed).toBe(true)
  })

  it('bez limitu nic nie jest zablokowane', () => {
    expect(gateProgress([], new Set(), null).passed).toBe(true)
  })
})
