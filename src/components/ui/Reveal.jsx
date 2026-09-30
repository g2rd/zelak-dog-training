import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Wejście sekcji: fade-up 24px (animations.sections z konfiguracji).
 *
 * Celowo BEZ framer-motion i bez inline `opacity: 0`.
 *
 * Ukrycie startowe robi CSS, ale tylko pod selektorem `.js`, który dokleja
 * do <html> mały skrypt w <head>. Efekt: przeglądarka z JS animuje treść,
 * a robot wyszukiwarki (albo przeglądarka z wyłączonym JS) dostaje stronę
 * z pełną, widoczną treścią — żaden akapit nie jest schowany za opacity:0.
 *
 * Element widoczny od razu po załadowaniu nie animuje się wcale — dzięki
 * temu nic nie mruga nad linią załamania.
 */
export function Reveal({ children, delay = 0, className, as: Tag = 'div', immediate = false }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (immediate) return undefined
    const el = ref.current
    if (!el) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [immediate])

  // Wariant „immediate": treść nad linią załamania. Animujemy samo przesunięcie,
  // bez krycia — inaczej element LCP czekałby na uruchomienie JavaScriptu.
  if (immediate) {
    return (
      <Tag
        className={cn('rise', className)}
        style={delay ? { animationDelay: `${delay}s` } : undefined}
      >
        {children}
      </Tag>
    )
  }

  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  )
}
