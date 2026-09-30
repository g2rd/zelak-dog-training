import { describe, expect, it } from 'vitest'
import { fitWithin } from '@/kursy/lib/dogPhoto'

describe('fitWithin', () => {
  it('zmniejsza zdjęcie pionowe po dłuższym boku', () => {
    expect(fitWithin(3024, 4032)).toEqual({ width: 600, height: 800 })
  })

  it('nie powiększa małego zdjęcia', () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 })
  })
})
