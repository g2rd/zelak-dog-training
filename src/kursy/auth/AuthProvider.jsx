import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/kursy/lib/queryClient'

const AuthCtx = createContext({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

/**
 * Kontekst sesji Supabase.
 *
 * `loading` jest prawdą do pierwszej odpowiedzi `getSession()` — w tym czasie
 * `ProtectedRoute` nie może jeszcze przekierować na logowanie, bo nie wie,
 * czy użytkownik jest zalogowany. Bez tego każde odświeżenie strony w strefie
 * mignęłoby ekranem logowania.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // Dane poprzedniego użytkownika nie mogą zostać w pamięci podręcznej.
    queryClient.clear()
  }, [])

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading, signOut }),
    [session, loading, signOut],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
