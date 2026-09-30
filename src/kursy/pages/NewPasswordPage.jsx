import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/kursy/layout/AuthLayout'
import { Field } from '@/kursy/components/Field'
import { Notice } from '@/kursy/components/Notice'
import { Loading } from '@/kursy/components/Loading'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { authErrorMessage } from '@/kursy/lib/errors'

const MIN_PASSWORD = 8

/**
 * Ustawienie nowego hasła po kliknięciu linku z e-maila.
 *
 * Link zawiera token, który klient Supabase wymienia na sesję jeszcze przed
 * wyrenderowaniem tej strony (`detectSessionInUrl`). Dlatego nie czytamy tu
 * nic z adresu — wystarczy sprawdzić, czy sesja istnieje.
 */
export default function NewPasswordPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!done) return undefined
    const timer = window.setTimeout(() => navigate('/panel', { replace: true }), 2500)
    return () => window.clearTimeout(timer)
  }, [done, navigate])

  if (loading) return <Loading label="Sprawdzam link…" />

  if (!session) {
    return (
      <AuthLayout title="Link nieaktywny" lead="Nie udało się potwierdzić linku do zmiany hasła.">
        <Notice tone="error" title="Link wygasł albo został już użyty">
          <p>Poproś o nowy — zajmie to chwilę.</p>
        </Notice>
        <Button to="/reset-hasla" className="w-full">
          Wyślij nowy link
        </Button>
      </AuthLayout>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD) {
      setError(`Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.`)
      return
    }
    if (password !== repeat) {
      setError('Hasła nie są takie same.')
      return
    }

    setBusy(true)
    const { error: authError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (authError) {
      setError(authErrorMessage(authError))
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <AuthLayout title="Hasło zmienione" lead="Za chwilę przeniesiemy Cię do panelu.">
        <Notice tone="success" title="Gotowe">
          <p>Nowe hasło jest zapisane. Od teraz loguj się właśnie nim.</p>
        </Notice>
        <Button to="/panel" className="w-full">
          Przejdź do panelu
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Nowe hasło" lead="Ustaw hasło, którym będziesz się logować.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Notice tone="error">{error}</Notice>}

        <Field
          label="Nowe hasło"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`Co najmniej ${MIN_PASSWORD} znaków.`}
        />

        <Field
          label="Powtórz hasło"
          type="password"
          name="repeat"
          autoComplete="new-password"
          required
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
        />

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? 'Zapisuję…' : 'Zapisz nowe hasło'}
        </Button>
      </form>
    </AuthLayout>
  )
}
