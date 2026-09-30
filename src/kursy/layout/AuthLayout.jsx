import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import config from '@/data/site.config.json'

/**
 * Wąska kolumna dla ekranów logowania, rejestracji i resetu hasła.
 * Bez nawigacji strefy — użytkownik nie jest jeszcze zalogowany.
 */
export function AuthLayout({ title, lead, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Seo title={`${title} | ZELAK Dog Training`} noindex />

      <header className="border-b border-line">
        <div className="container-content flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label={`${config.brand.fullName} — strona główna`}>
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
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="flex flex-1 items-start justify-center px-5 py-12 sm:py-16">
        <div className="flex w-full max-w-[420px] flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl">{title}</h1>
            {lead && <p className="text-[15px] text-secondary">{lead}</p>}
          </div>

          {children}

          {footer && <div className="flex flex-col gap-3 border-t border-line pt-6">{footer}</div>}

          <Link
            to="/"
            className="inline-flex items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Wróć na stronę główną
          </Link>
        </div>
      </main>
    </div>
  )
}
