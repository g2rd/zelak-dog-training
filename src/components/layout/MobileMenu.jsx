import { useEffect, useRef } from 'react'
import { GraduationCap, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { scrollToSection } from '@/utils/scrollToSection'
import { Button } from '@/components/ui/Button'
import config from '@/data/site.config.json'

/**
 * Menu pełnoekranowe (navigation.mobile.type = "fullscreen-menu").
 *
 * Zamyka się klawiszem Escape, blokuje scroll tła i przenosi focus na przycisk
 * zamknięcia — wymogi WCAG dla dialogu modalnego.
 *
 * Pojawienie się animuje CSS (klasa `menu-enter`), nie biblioteka — dzięki temu
 * z projektu wypadło framer-motion (122 kB). Animacja wyjścia została pominięta
 * świadomie: kosztowałaby opóźnione odmontowanie i osobny stan, a przy zamykaniu
 * menu nikt na nią nie patrzy.
 */
export function MobileMenu({ open, onClose, isHome, activeSection }) {
  const closeButtonRef = useRef(null)

  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return undefined

    closeButtonRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleClick = (event, target) => {
    onClose()
    if (!isHome) return
    // Poczekaj na odblokowanie scrolla, zanim przewiniemy stronę.
    event.preventDefault()
    requestAnimationFrame(() => scrollToSection(target))
  }

  return (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu nawigacji"
      className="menu-enter fixed inset-0 z-[60] flex flex-col bg-ink lg:hidden"
    >
      <div className="container-content flex h-navbar shrink-0 items-center justify-between">
        <span className="font-heading text-xl uppercase tracking-wider">{config.brand.name}</span>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Zamknij menu"
          className="flex h-11 w-11 items-center justify-center rounded border border-line text-primary transition-colors hover:bg-primary hover:text-ink"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <nav
        aria-label="Nawigacja mobilna"
        className="container-content flex flex-1 flex-col justify-center gap-2 pb-16"
      >
        {config.navigation.map((item, index) => {
          const id = item.target.replace('#', '')
          const isActive = isHome && activeSection === id
          const label = (
            <>
              <span aria-hidden="true" className="mr-4 text-sm text-muted">
                0{index + 1}
              </span>
              {item.label}
            </>
          )

          return isHome ? (
            <a
              key={item.target}
              href={item.target}
              onClick={(event) => handleClick(event, item.target)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'border-b border-line py-5 font-heading text-3xl uppercase tracking-heading transition-colors',
                isActive ? 'text-primary' : 'text-secondary',
              )}
            >
              {label}
            </a>
          ) : (
            <Link
              key={item.target}
              to={`/${item.target}`}
              onClick={onClose}
              className="border-b border-line py-5 font-heading text-3xl uppercase tracking-heading text-secondary transition-colors"
            >
              {label}
            </Link>
          )
        })}

        <Button
          variant="primary"
          size="lg"
          className="mt-8 w-full"
          {...(isHome ? { target: config.navCta.target } : { to: `/${config.navCta.target}` })}
          onClick={(event) => (isHome ? handleClick(event, config.navCta.target) : onClose())}
        >
          {config.navCta.label}
        </Button>

        <Button variant="outline" size="lg" className="w-full" to={config.navZone.path} rel="nofollow" onClick={onClose}>
          <GraduationCap aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          {config.navZone.label}
        </Button>
      </nav>
    </div>
  )
}
