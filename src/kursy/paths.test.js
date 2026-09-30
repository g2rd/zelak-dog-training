import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ZONE_PREFIXES, isZonePath } from '@/kursy/paths'

describe('isZonePath', () => {
  it.each([
    '/panel',
    '/kursy',
    '/kursy/fundamenty-60',
    '/kursy/fundamenty-60/dzien/12',
    '/kursy/fundamenty-60/dzien/12/zadanie/abc',
    '/konto',
    '/logowanie',
    '/rejestracja',
    '/reset-hasla',
    '/nowe-haslo',
    '/aktywuj',
    '/program/fundament',
    '/program/fundament/spotkanie/3',
    '/trener',
    '/trener/kursant/abc',
  ])('rozpoznaje adres strefy: %s', (adres) => {
    expect(isZonePath(adres)).toBe(true)
  })

  it.each([
    '/',
    '/regulamin',
    '/polityka-prywatnosci',
    '/szkolenie-psow-zabrze',
    '/oferta',
    '/kontakt',
  ])('nie myli adresu wizytówki ze strefą: %s', (adres) => {
    expect(isZonePath(adres)).toBe(false)
  })

  it('nie łapie adresu, który tylko zaczyna się tak samo', () => {
    // `/kursy-online` to nie `/kursy`. Gdyby dopasowanie działało po przedrostku
    // tekstu, a nie po całym segmencie ścieżki, taka podstrona wizytówki
    // zostałaby przekierowana do strefy i zniknęła z wyszukiwarki.
    expect(isZonePath('/kursy-online')).toBe(false)
    expect(isZonePath('/panele-sloneczne')).toBe(false)
  })
})

/**
 * Najważniejszy test w tym pliku.
 *
 * Lista adresów strefy żyje w CZTERECH miejscach: `ZONE_PREFIXES`, routing
 * Reacta, `public/.htaccess` i `public/robots.txt`. Apache i robots.txt nie
 * czytają JavaScriptu, więc trzy z tych miejsc synchronizuje się ręcznie.
 *
 * Skutek rozjazdu jest cichy i dotkliwy: dopisanie trasy w Reakcie bez wpisu
 * w `.htaccess` sprawia, że po wdrożeniu adres zwraca 404 — ale wyłącznie na
 * produkcji, bo lokalnie serwer deweloperski obsługuje wszystko sam. Ten test
 * wyłapie to, zanim ktokolwiek zobaczy błąd.
 */
describe('spójność listy adresów strefy', () => {
  const root = path.resolve(__dirname, '../..')
  const htaccess = fs.readFileSync(path.join(root, 'public/.htaccess'), 'utf8')
  const robots = fs.readFileSync(path.join(root, 'public/robots.txt'), 'utf8')

  it('.htaccess kieruje na app.html dokładnie te same przedrostki', () => {
    const regula = htaccess
      .split('\n')
      .find((l) => l.includes('/app.html') && l.trim().startsWith('RewriteRule'))

    expect(regula, 'brak reguły kierującej strefę na app.html').toBeTruthy()

    const grupa = regula.match(/\^\(([^)]+)\)/)
    expect(grupa, 'reguła nie zawiera listy przedrostków w nawiasie').toBeTruthy()

    const zHtaccess = grupa[1].split('|').sort()
    expect(zHtaccess).toEqual([...ZONE_PREFIXES].sort())
  })

  it('robots.txt blokuje każdy przedrostek strefy', () => {
    const zablokowane = robots
      .split('\n')
      .filter((l) => l.startsWith('Disallow:'))
      .map((l) => l.replace('Disallow:', '').trim().replace(/^\//, ''))

    for (const prefix of ZONE_PREFIXES) {
      expect(zablokowane, `brak wpisu Disallow dla /${prefix}`).toContain(prefix)
    }
  })

  it('żaden przedrostek nie zawiera ukośnika ani znaku specjalnego', () => {
    // Przedrostek to PIERWSZY segment ścieżki. Ukośnik rozbiłby dopasowanie
    // w `isZonePath`, a znak specjalny zepsułby wyrażenie w .htaccess.
    for (const prefix of ZONE_PREFIXES) {
      expect(prefix).toMatch(/^[a-z0-9-]+$/)
    }
  })
})
