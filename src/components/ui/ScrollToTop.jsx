import { ArrowUp } from 'lucide-react'
import { useScrolled } from '@/hooks/useScrolled'

/**
 * Przycisk powrotu na górę, widoczny po przewinięciu ~ekranu.
 */
export function ScrollToTop() {
  const visible = useScrolled(600)

  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
      }}
      aria-label="Wróć na górę strony"
      className={[
        'fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded',
        'border border-line bg-surface text-primary',
        'transition-all duration-300 hover:bg-primary hover:text-ink',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
    >
      <ArrowUp aria-hidden="true" className="h-5 w-5" />
    </button>
  )
}
