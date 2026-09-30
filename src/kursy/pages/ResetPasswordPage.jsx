import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/kursy/layout/AuthLayout'
import { Field } from '@/kursy/components/Field'
import { Notice } from '@/kursy/components/Notice'
import { authErrorMessage } from '@/kursy/lib/errors'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nowe-haslo`,
    })
    setBusy(false)
    if (authError) {
      setError(authErrorMessage(authError))
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Sprawdź skrzynkę" lead="Link do zmiany hasła jest w drodze.">
        <Notice tone="success" title="Wysłane">
          <p>
            Jeśli konto o adresie <strong className="text-primary">{email}</strong> istnieje, poszedł
            na nie link do ustawienia nowego hasła. Link jest ważny przez godzinę.
          </p>
        </Notice>
        <Button to="/logowanie" variant="outline" className="w-full">
          Wróć do logowania
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset hasła"
      lead="Podaj adres e-mail, którym się rejestrowałeś. Wyślemy link do ustawienia nowego hasła."
    >
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

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? 'Wysyłam…' : 'Wyślij link'}
        </Button>
      </form>

      <Button to="/logowanie" variant="ghost">
        Wróć do logowania
      </Button>
    </AuthLayout>
  )
}
