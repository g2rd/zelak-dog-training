import { useEffect, useRef, useState } from 'react'

/**
 * Postęp przewijania elementu: 0 = góra elementu przy górze ekranu,
 * 1 = dolna krawędź elementu opuściła ekran.
 *
 * Zastępuje `useScroll` z framer-motion. Powody:
 *  - framer-motion to 122 kB (41 kB gzip) tylko dla dwóch efektów paralaksy,
 *  - pomiar robimy w requestAnimationFrame i tylko wtedy, gdy element jest
 *    na ekranie (IntersectionObserver), więc nie wymuszamy przeliczania
 *    układu strony przy każdym zdarzeniu scroll.
 *
 * @param {import('react').RefObject<HTMLElement>} ref
 * @returns {number} wartość 0..1
 */
export function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0)
  const frame = useRef(0)
  const active = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const measure = () => {
      frame.current = 0
      const rect = el.getBoundingClientRect()
      const span = rect.height || 1
      // 0 gdy góra elementu jest przy górze ekranu, 1 gdy element wyjechał.
      const value = Math.min(1, Math.max(0, -rect.top / span))
      setProgress(value)
    }

    const onScroll = () => {
      if (!active.current || frame.current) return
      frame.current = requestAnimationFrame(measure)
    }

    // Liczymy tylko wtedy, gdy sekcja jest widoczna.
    const observer = new IntersectionObserver(
      ([entry]) => {
        active.current = entry.isIntersecting
        if (entry.isIntersecting) onScroll()
      },
      { threshold: 0 },
    )
    observer.observe(el)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [ref])

  return progress
}

/** Czy użytkownik prosi o ograniczenie animacji. */
export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(query.matches)
    const onChange = (event) => setReduce(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduce
}
