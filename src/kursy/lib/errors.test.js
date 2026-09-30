import { describe, expect, it, vi } from 'vitest'
import { authErrorMessage, dataErrorMessage } from '@/kursy/lib/errors'

// Nieznany błąd trafia do konsoli — wyciszamy, żeby nie zaśmiecał wyniku testów.
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('authErrorMessage', () => {
  it('bez błędu zwraca pusty łańcuch', () => {
    expect(authErrorMessage(null)).toBe('')
  })

  it.each([
    ['Invalid login credentials', /nieprawidłowy e-mail lub hasło/i],
    ['Email not confirmed', /potwierdź/i],
    ['User already registered', /już istnieje/i],
    ['Password should be at least 6 characters', /za słabe/i],
    ['For security purposes, rate limit exceeded', /za dużo prób/i],
    ['Error sending confirmation email', /nie udało się wysłać e-maila/i],
    ['Failed to fetch', /brak połączenia/i],
  ])('tłumaczy komunikat: %s', (message, oczekiwane) => {
    expect(authErrorMessage({ message })).toMatch(oczekiwane)
  })

  it('rozpoznaje też po kodzie błędu, nie tylko po treści', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: '' })).toMatch(
      /nieprawidłowy e-mail lub hasło/i,
    )
  })

  it('nieznany błąd dostaje komunikat ogólny, nie techniczny', () => {
    const tekst = authErrorMessage({ message: 'Undocumented internal failure 0x8f' })
    expect(tekst).toMatch(/coś poszło nie tak/i)
    expect(tekst).not.toContain('0x8f')
  })

  it('żaden komunikat nie zdradza, czy konto o danym adresie istnieje', () => {
    // Enumeracja kont: komunikat przy logowaniu nie może rozróżniać
    // „nie ma takiego konta" od „złe hasło".
    expect(authErrorMessage({ message: 'Invalid login credentials' })).toBe(
      'Nieprawidłowy e-mail lub hasło.',
    )
  })
})

describe('dataErrorMessage', () => {
  it('bez błędu zwraca pusty łańcuch', () => {
    expect(dataErrorMessage(null)).toBe('')
  })

  it('brak sieci ma własny komunikat', () => {
    expect(dataErrorMessage({ message: 'Failed to fetch' })).toMatch(/brak połączenia/i)
  })

  it('pozostałe błędy dostają komunikat ogólny', () => {
    expect(dataErrorMessage({ message: 'PGRST301' })).toMatch(/nie udało się pobrać/i)
  })
})
