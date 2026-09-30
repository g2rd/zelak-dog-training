import { useEffect, useState } from 'react'

/**
 * Zwraca true, gdy strona jest przewinięta poniżej progu.
 * Używane przez navbar do przełączania tło przezroczyste → pełne.
 * @param {number} threshold próg w pikselach
 */
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
