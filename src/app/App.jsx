import { useLocation } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { AppRoutes } from '@/app/routes'
import { isZonePath } from '@/kursy/paths'

/**
 * Powłoka aplikacji: navbar + treść trasy + stopka.
 * Router jest montowany wyżej (main.jsx), żeby dało się go podmienić w testach.
 *
 * Strefa kursów ma własną powłokę (StrefaLayout / AuthLayout) z inną nawigacją:
 * wizytówka prowadzi do kotwic sekcji, a strefa do Panelu, Kursów i Konta.
 * Renderowanie obu naraz dałoby dwa paski nawigacji i dwie stopki, dlatego
 * navbar i stopka wizytówki są tu wyłączane dla adresów strefy.
 */
export default function App() {
  const { pathname } = useLocation()
  const inZone = isZonePath(pathname)

  if (inZone) return <AppRoutes />

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Przejdź do treści
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <AppRoutes />
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  )
}
