import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/seo/Seo'
import { Notice } from '@/kursy/components/Notice'

/**
 * Widok zastępczy, gdy build nie ma zmiennych VITE_SUPABASE_*.
 * Wizytówka działa normalnie; tylko strefa czeka na konfigurację.
 */
export function NotConfigured() {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-5 py-16">
      <Seo title="Strefa kursów | ZELAK Dog Training" noindex />
      <h1 className="text-3xl">Strefa kursów</h1>
      <Notice tone="warning" title="Strefa nie jest jeszcze skonfigurowana">
        <p>
          Brakuje zmiennych <code className="text-primary">VITE_SUPABASE_URL</code> i{' '}
          <code className="text-primary">VITE_SUPABASE_ANON_KEY</code>. Skopiuj{' '}
          <code className="text-primary">.env.example</code> do{' '}
          <code className="text-primary">.env.local</code>, wpisz klucze z panelu Supabase
          i uruchom projekt ponownie.
        </p>
      </Notice>
      <div>
        <Button to="/" variant="outline">
          Wróć na stronę główną
        </Button>
      </div>
    </div>
  )
}
