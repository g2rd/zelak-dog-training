import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/kursy/layout/AuthLayout'
import { CheckboxField, Field } from '@/kursy/components/Field'
import { Notice } from '@/kursy/components/Notice'
import { GoogleSignIn } from '@/kursy/components/GoogleSignIn'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { authErrorMessage } from '@/kursy/lib/errors'
import { safeNext } from '@/kursy/lib/redirect'

const MIN_PASSWORD = 8

export default function RegisterPage() {
  const { session } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [terms, setTerms] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  // Dokąd po rejestracji przez Google — to samo co przy logowaniu.
  const next = safeNext(location.state?.from?.pathname)

  if (session) return <Navigate to={next} replace />

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password.length < MIN_PASSWORD) {
      setError(`Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.`)
      return
    }
    if (!terms) {
      setError('Do założenia konta potrzebna jest akceptacja regulaminu.')
      return
    }

    setBusy(true)
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // Trafia do `raw_user_meta_data`, a stamtąd wyzwalacz `handle_new_user`
        // przepisuje to do tabeli `profiles`.
        data: { full_name: form.fullName.trim(), marketing_consent: marketing },
        emailRedirectTo: `${window.location.origin}/panel`,
      },
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
      <AuthLayout title="Sprawdź skrzynkę" lead="Konto jest prawie gotowe.">
        <Notice tone="success" title="Wysłaliśmy link potwierdzający">
          <p>
            Na adres <strong className="text-primary">{form.email}</strong> poszedł e-mail z linkiem
            aktywacyjnym. Kliknij go, żeby dokończyć zakładanie konta.
          </p>
          <p className="text-sm text-muted">
            Nie ma wiadomości? Zajrzyj do folderu ze spamem — czasem trafia tam pierwszy e-mail
            z nowej domeny.
          </p>
        </Notice>
        <Button to="/logowanie" variant="outline" className="w-full">
          Przejdź do logowania
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Rejestracja" lead="Konto jest potrzebne, żeby zapisywać postęp w kursie.">
      <GoogleSignIn next={next} oneTap />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Notice tone="error">{error}</Notice>}

        <Field
          label="Imię"
          name="fullName"
          autoComplete="given-name"
          required
          value={form.fullName}
          onChange={set('fullName')}
          placeholder="Jak mam się do Ciebie zwracać?"
        />

        <Field
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
          placeholder="twoj@email.pl"
        />

        <Field
          label="Hasło"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={form.password}
          onChange={set('password')}
          hint={`Co najmniej ${MIN_PASSWORD} znaków.`}
        />

        <div className="flex flex-col gap-4 border-t border-line pt-5">
          <CheckboxField
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            required
            label={
              <>
                Akceptuję{' '}
                <Link to="/regulamin" target="_blank" className="underline hover:text-primary">
                  regulamin
                </Link>{' '}
                i{' '}
                <Link to="/polityka-prywatnosci" target="_blank" className="underline hover:text-primary">
                  politykę prywatności
                </Link>
                .
              </>
            }
          />

          {/* Zgoda marketingowa musi być osobna i domyślnie niezaznaczona (RODO). */}
          <CheckboxField
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            label="Chcę dostawać e-maile o nowych kursach i materiałach treningowych. Zgodę mogę wycofać w każdej chwili."
          />
        </div>

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? 'Zakładam konto…' : 'Załóż konto'}
        </Button>
      </form>

      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <p className="text-[15px] text-secondary">Masz już konto?</p>
        <Button to="/logowanie" state={location.state} variant="outline" className="w-full">
          Zaloguj się
        </Button>
      </div>
    </AuthLayout>
  )
}
