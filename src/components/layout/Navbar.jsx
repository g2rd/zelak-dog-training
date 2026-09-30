import { useState } from 'react'
import { GraduationCap, Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useScrolled } from '@/hooks/useScrolled'
import { useActiveSection } from '@/hooks/useActiveSection'
import { scrollToSection } from '@/utils/scrollToSection'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MobileMenu } from '@/components/layout/MobileMenu'
import config from '@/data/site.config.json'

const SECTION_IDS = config.navigation.map((item) => item.target.replace('#', ''))

/**
 * Przyklejony navbar: przezroczysty na górze, pełne tło po przewinięciu.
 * Na podstronach (np. polityka prywatności) kotwice prowadzą na stronę główną.
 */
export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const scrolled = useScrolled(24)
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const activeSection = useActiveSection(SECTION_IDS)

  const handleAnchorClick = (event, target) => {
    if (!isHome) return // pozwól Linkowi przejść na "/" + kotwica
    if (scrollToSection(target)) event.preventDefault()
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 h-navbar transition-colors duration-300',
          scrolled || menuOpen
            ? 'border-b border-line bg-ink/95 backdrop-blur'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="container-content flex h-full items-center justify-between gap-3 sm:gap-6">
          <Link
            to="/"
            onClick={(event) => isHome && handleAnchorClick(event, '#start')}
            className="flex items-center gap-3"
            aria-label={`${config.brand.fullName} — strona główna`}
          >
            <img
              src={config.brand.badge.src}
              alt=""
              aria-hidden="true"
              className="h-11 w-11 shrink-0 rounded-full"
            />
            <span className="font-heading text-xl uppercase tracking-wider text-primary">
              {config.brand.name}
            </span>
          </Link>

          <nav aria-label="Nawigacja główna" className="hidden items-center gap-9 lg:flex">
            {config.navigation.map((item) => {
              const id = item.target.replace('#', '')
              const isActive = isHome && activeSection === id

              return isHome ? (
                <a
                  key={item.target}
                  href={item.target}
                  onClick={(event) => handleAnchorClick(event, item.target)}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'font-heading text-[12px] uppercase tracking-wider transition-colors',
                    isActive ? 'text-primary' : 'text-secondary hover:text-primary',
                  )}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.target}
                  to={`/${item.target}`}
                  className="font-heading text-[12px] uppercase tracking-wider text-secondary transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              )
            })}

            {/* Strefa kursów: widoczna w menu, ale wizualnie pod przyciskiem
                „Umów trening" — strona jest przede wszystkim o trenerze.
                `nofollow` z tego samego powodu co w stopce: robots.txt
                blokuje strefę, a podlinkowany zablokowany adres Google
                potrafi pokazać w wynikach jako goły URL. */}
            <Link
              to={config.navZone.path}
              rel="nofollow"
              className="flex items-center gap-2 font-heading text-[12px] uppercase tracking-wider text-secondary transition-colors hover:text-primary"
            >
              <GraduationCap aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {config.navZone.label}
            </Link>

            {isHome ? (
              <Button variant="outline" target={config.navCta.target}>
                {config.navCta.label}
              </Button>
            ) : (
              <Button variant="outline" to={`/${config.navCta.target}`}>
                {config.navCta.label}
              </Button>
            )}
            <ThemeToggle />
          </nav>

          {/* Na małych ekranach przełącznik motywu stoi obok przycisku menu,
              a nie w środku menu — ma być dostępny bez otwierania nakładki. */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Otwórz menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="flex h-11 w-11 items-center justify-center rounded border border-line text-primary transition-colors hover:bg-primary hover:text-ink"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isHome={isHome}
        activeSection={activeSection}
      />
    </>
  )
}
