import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'zelak-theme'

/** Kolejność przełączania w interfejsie. */
export const THEME_ORDER = ['light', 'dark', 'system']

export const THEME_LABELS = {
  dark: 'Motyw ciemny',
  light: 'Motyw jasny',
  system: 'Motyw wg ustawień systemu',
}

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return THEME_ORDER.includes(value) ? value : null
  } catch {
    // Tryb prywatny lub zablokowane dane witryny. Brak zapisu to nie błąd —
    // przełącznik ma wtedy działać na czas jednej wizyty.
    return null
  }
}

function prefersLight() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  )
}

function resolve(policy) {
  if (policy === 'system') return prefersLight() ? 'light' : 'dark'
  return policy
}

/**
 * Zarządzanie motywem.
 *
 * Źródłem prawdy jest atrybut data-theme-policy na <html> — ustawia go skrypt
 * w <head> jeszcze przed wyrenderowaniem Reacta (patrz index.html). Ten hook
 * go tylko czyta i modyfikuje, dlatego nie ma tu mrugnięcia przy wejściu.
 *
 * WAŻNE PRZY PRERENDERINGU. Stan startowy MUSI być taki sam po stronie serwera
 * i klienta, inaczej hydratacja się rozjedzie (React #418). Dlatego stan
 * startowy jest stały — taki, jaki wyrenderował prerender — a prawdziwa
 * wartość trafia do stanu dopiero w useEffect, już po hydratacji.
 *
 * Tym stanem jest 'light', bo taki jest DEFAULT_POLICY w index.html.
 * Zmieniając tam domyślny motyw, trzeba zmienić też tutaj — inaczej ikona
 * przełącznika przez moment pokaże nie ten motyw, który jest ustawiony.
 */
export function useTheme() {
  const [policy, setPolicy] = useState('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const fromDom = document.documentElement.getAttribute('data-theme-policy')
    setPolicy(readStored() || (THEME_ORDER.includes(fromDom) ? fromDom : 'light'))
    setMounted(true)
  }, [])

  // Zmiana ustawienia systemowego w locie — ma znaczenie tylko przy 'system'.
  useEffect(() => {
    if (policy !== 'system' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => applyToDom('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [policy])

  const setTheme = useCallback((next) => {
    setPolicy(next)
    applyToDom(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* brak zapisu — wybór obowiązuje do końca wizyty */
    }
  }, [])

  const cycle = useCallback(() => {
    setPolicy((current) => {
      const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length]
      applyToDom(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* jw. */
      }
      return next
    })
  }, [])

  return { policy, resolved: resolve(policy), setTheme, cycle, mounted }
}

function applyToDom(policy) {
  const resolved = resolve(policy)
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  root.setAttribute('data-theme-policy', policy)

  // Kolor paska adresu na Androidzie / iOS.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'light' ? '#FAFAF9' : '#000000')
}
