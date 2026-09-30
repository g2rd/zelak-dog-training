import { describe, expect, it } from 'vitest'
import { safeNext } from '@/kursy/lib/redirect'

describe('safeNext', () => {
  it('przepuszcza ścieżki strefy', () => {
    expect(safeNext('/aktywuj')).toBe('/aktywuj')
    expect(safeNext('/program/fundament?pies=1')).toBe('/program/fundament?pies=1')
  })

  it.each(['https://obca.pl', '//obca.pl', '/\\obca.pl', 'javascript:alert(1)', '', null])(
    'odrzuca adres spoza serwisu: %s',
    (value) => {
      expect(safeNext(value)).toBe('/panel')
    },
  )
})
