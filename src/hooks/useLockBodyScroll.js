import { useEffect } from 'react'

/**
 * Blokuje przewijanie strony pod otwartym menu pełnoekranowym.
 * @param {boolean} locked
 */
export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return undefined

    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [locked])
}
