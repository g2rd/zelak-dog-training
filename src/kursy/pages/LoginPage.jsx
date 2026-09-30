import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/kursy/layout/AuthLayout'
import { Field } from '@/kursy/components/Field'
import { Notice } from '@/kursy/components/Notice'
import { Loading } from '@/kursy/components/Loading'
import { GoogleSignIn } from '@/kursy/components/GoogleSignIn'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { authErrorMessage } from '@/kursy/lib/errors'
import { safeNext } from '@/kursy/lib/redirect'

/**
 * Błąd z powrotu po logowaniu przez Google: Supabase dopisuje go do adresu
 * (w zapytaniu albo po `#`). Najczęściej to zamknięte okno Google albo
 * „Anuluj” — dlatego komunikat nie straszy.
 */
function oauthError(search) {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  return search.get('error') || hash.get('error')
}

export default function LoginPage() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Dokąd wracamy po zalogowaniu: `?next=` po powrocie z Google, stan
  // ustawiony przez ProtectedRoute przy zwykłym wejściu.
  const from = safeNext(search.get('next') ?? location.state?.from?.pathname)
  const googleFailed = Boolean(oauthError(search))

  if (loading) return <Loading label="Sprawdzam sesję…" />
  if (session) return <Navigate to={from} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (authError) {
      setError(authErrorMessage(authError))
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <AuthLayout title="Logowanie" lead="Wejdź do swojej strefy kursów.">
      {googleFailed && (
        <Notice tone="error">
          Logowanie przez Google zostało przerwane albo się nie udało. Spróbuj ponownie albo zaloguj
          się e-mailem.
        </Notice>
      )}

      <GoogleSignIn next={from} oneTap />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Notice tone="error">{error}</Notice>}

        <Field
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="twoj@email.pl"
        />

        <Field
          label="Hasło"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? 'Logowanie…' : 'Zaloguj się'}
        </Button>

        <Link
          to="/reset-hasla"
          className="text-sm text-muted underline transition-colors hover:text-primary"
        >
          Nie pamiętam hasła
        </Link>
      </form>

      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <p className="text-[15px] text-secondary">Nie masz jeszcze konta?</p>
        <Button to="/rejestracja" state={location.state} variant="outline" className="w-full">
          Załóż konto
        </Button>
      </div>
    </AuthLayout>
  )
}
