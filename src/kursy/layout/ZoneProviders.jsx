import { Outlet } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/kursy/lib/queryClient'
import { AuthProvider } from '@/kursy/auth/AuthProvider'
import { isSupabaseConfigured } from '@/lib/supabase'
import { NotConfigured } from '@/kursy/components/NotConfigured'

/**
 * Korzeń strefy kursów — trasa układu (layout route) obejmująca WSZYSTKIE
 * adresy strefy, także ekrany logowania.
 *
 * Dostawcy siedzą tutaj, a nie w `main.jsx`, celowo: cała strefa jest jednym
 * leniwym chunkiem, więc supabase-js i React Query pobiera dopiero ten, kto
 * wejdzie na /panel, /kursy czy /logowanie. Odwiedzający wizytówkę nie płaci
 * za to ani bajtem.
 */
export function ZoneProviders() {
  if (!isSupabaseConfigured) return <NotConfigured />

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  )
}
