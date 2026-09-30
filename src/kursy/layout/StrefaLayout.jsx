import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, ClipboardList, LayoutGrid, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { useIsTrainer } from '@/kursy/hooks/useProgram'
import config from '@/data/site.config.json'

const NAV = [
  { to: '/panel', label: 'Panel', Icon: LayoutGrid },
  { to: '/kursy', label: 'Kursy', Icon: BookOpen },
  { to: '/konto', label: 'Konto', Icon: User },
]

// Tylko dla trenera. Sam link niczego nie otwiera — dane panelu wydaje baza
// wyłącznie kontu z tabeli `trainers`.
const TRAINER_NAV = { to: '/trener', label: 'Trener', Icon: ClipboardList }

/**
 * Powłoka strefy dla zalogowanych.
 *
 * Nie używa navbara wizytówki: tam nawigacja to kotwice sekcji, a tutaj
 * potrzebne są trzy stałe miejsca. Na telefonie nawigacja siedzi na dole
 * (kciuk sięga), od `md` przenosi się do górnego paska.
 */
export function StrefaLayout() {
  const { signOut } = useAuth()
  const { pathname } = useLocation()
  const { data: isTrainer } = useIsTrainer()
  const nav = isTrainer ? [...NAV, TRAINER_NAV] : NAV

  // Przejście między ekranami strefy zawsze zaczyna się od góry — inaczej
  // po wejściu w dzień z połowy siatki 60 dni ekran zostaje przewinięty.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
        <div className="container-content flex h-16 items-center justify-between gap-4">
          <Link to="/panel" className="flex items-center gap-3" aria-label="Strefa kursów — panel">
            <img
              src={config.brand.badge.src}
              alt=""
              aria-hidden="true"
              className="h-9 w-9 shrink-0 rounded-full"
            />
            <span className="font-heading text-lg uppercase tracking-wider text-primary">
              {config.brand.name}
            </span>
          </Link>

          <nav aria-label="Nawigacja strefy" className="hidden items-center gap-8 md:flex">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'font-heading text-[12px] uppercase tracking-wider transition-colors',
                    isActive ? 'text-primary' : 'text-secondary hover:text-primary',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              aria-label="Wyloguj się"
              title="Wyloguj się"
              className="flex h-11 w-11 items-center justify-center rounded border border-line text-primary transition-colors hover:bg-primary hover:text-ink"
            >
              <LogOut aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </header>

      {/* Dolny odstęp robi miejsce pod nawigację mobilną. */}
      <main id="main" className="flex-1 pb-24 md:pb-12">
        <Outlet />
      </main>

      <nav
        aria-label="Nawigacja strefy"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur md:hidden"
      >
        <ul className={cn('grid', nav.length === 4 ? 'grid-cols-4' : 'grid-cols-3')}>
          {nav.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    // 64 px wysokości — powyżej progu 44 px z wytycznych dotykowych.
                    'flex h-16 flex-col items-center justify-center gap-1 transition-colors',
                    isActive ? 'text-primary' : 'text-muted',
                  )
                }
              >
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
                <span className="font-heading text-[10px] uppercase tracking-wider">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
