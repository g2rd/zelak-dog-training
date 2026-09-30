import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { Loading } from '@/kursy/components/Loading'

/**
 * Wpuszcza dalej tylko zalogowanych; resztę odsyła na /logowanie i zapamiętuje,
 * skąd przyszli (`state.from`), żeby po zalogowaniu wrócić w to samo miejsce.
 *
 * To WYŁĄCZNIE wygoda interfejsu. Prawdziwą ochroną danych są polityki RLS
 * w bazie — bez sesji zapytania i tak nie zwrócą płatnych treści.
 */
export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading label="Sprawdzam sesję…" />
  if (!session) return <Navigate to="/logowanie" state={{ from: location }} replace />
  return <Outlet />
}
