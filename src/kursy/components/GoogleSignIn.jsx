import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Notice } from '@/kursy/components/Notice'
import { GOOGLE_CLIENT_ID, createNonce, loadGoogleIdentity } from '@/kursy/lib/googleIdentity'

/**
 * Czy logowanie przez Google jest włączone w Supabase (Authentication →
 * Providers). Publiczne ustawienia Auth, klucz anon wystarczy. Dopóki
 * dostawca jest wyłączony, przycisku nie ma — na produkcji nie pojawi się
 * więc przycisk, który kończy się błędem Supabase.
 */
function useGoogleEnabled() {
  return useQuery({
    queryKey: ['auth-google-enabled'],
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      })
      if (!res.ok) return false
      const settings = await res.json()
      return Boolean(settings?.external?.google)
    },
  })
}

/**
 * „Kontynuuj z Google” — to samo dla logowania i rejestracji: pierwsze
 * wejście zakłada konto (imię i potwierdzony e-mail przychodzą od Google),
 * kolejne loguje. Konto z hasłem na ten sam adres Supabase łączy w jedno.
 *
 * Dwa tryby, wybierane automatycznie:
 *  - GIS (domyślnie): przycisk i One Tap Google na zelak.pl, bez
 *    przekierowania — Google pokazuje „zelak.pl”, nie adres Supabase,
 *  - przekierowanie (zapas): gdy brak VITE_GOOGLE_CLIENT_ID albo skrypt
 *    Google się nie wczytał (blokada reklam, sieć firmowa). Działa zawsze,
 *    ale Google pokazuje wtedy adres serwera Supabase.
 *
 * @param {{ next: string, oneTap?: boolean }} props
 *   next   — ścieżka, na którą wrócić po zalogowaniu,
 *   oneTap — czy od razu zaproponować okienko „Kontynuuj jako …”.
 */
export function GoogleSignIn({ next, oneTap = false }) {
  const { data: enabled } = useGoogleEnabled()
  const [mode, setMode] = useState(GOOGLE_CLIENT_ID ? 'gis' : 'redirect')

  if (!enabled) return null

  return (
    <div className="flex flex-col gap-4">
      {mode === 'gis' ? (
        <GisButton next={next} oneTap={oneTap} onUnavailable={() => setMode('redirect')} />
      ) : (
        <RedirectButton next={next} />
      )}

      <p className="text-sm text-muted">
        Kontynuując z Google, akceptujesz{' '}
        <Link to="/regulamin" target="_blank" className="underline hover:text-primary">
          regulamin
        </Link>{' '}
        i{' '}
        <Link to="/polityka-prywatnosci" target="_blank" className="underline hover:text-primary">
          politykę prywatności
        </Link>
        .
      </p>

      <div className="flex items-center gap-3 font-heading text-[11px] uppercase tracking-wider text-muted">
        <span className="h-px flex-1 bg-line" />
        albo e-mailem
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  )
}

/** Przycisk rysowany przez Google (ramka z accounts.google.com) + One Tap. */
function GisButton({ next, oneTap, onUnavailable }) {
  const navigate = useNavigate()
  const box = useRef(null)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  // Najnowsze wartości bez ponownego uruchamiania efektu — inaczej każde
  // przerysowanie rodzica od nowa ładowałoby przycisk i One Tap.
  const latest = useRef({ next, onUnavailable, navigate })
  latest.current = { next, onUnavailable, navigate }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      let google
      try {
        google = await loadGoogleIdentity()
      } catch {
        if (!cancelled) latest.current.onUnavailable()
        return
      }
      if (cancelled || !box.current) return

      const nonce = await createNonce()
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: nonce.hashed,
        use_fedcm_for_prompt: true,
        // Okienko One Tap zamyka się po kliknięciu poza nim — bez natręctwa.
        cancel_on_tap_outside: true,
        callback: async ({ credential }) => {
          setError(false)
          setBusy(true)
          const { error: authError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
            nonce: nonce.raw,
          })
          setBusy(false)
          if (authError) {
            console.error('[google]', authError)
            setError(true)
            return
          }
          latest.current.navigate(latest.current.next, { replace: true })
        },
      })

      const dark = document.documentElement.getAttribute('data-theme') === 'dark'
      google.accounts.id.renderButton(box.current, {
        type: 'standard',
        theme: dark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'center',
        locale: 'pl',
        // Google przyjmuje szerokość w pikselach, najwyżej 400.
        width: Math.min(400, Math.round(box.current.clientWidth || 320)),
      })

      if (oneTap) google.accounts.id.prompt()
    })()

    return () => {
      cancelled = true
      // One Tap nie może zostać na ekranie po wyjściu ze strony logowania.
      window.google?.accounts?.id?.cancel()
    }
  }, [oneTap])

  return (
    <>
      {/* Stała wysokość, żeby formularz niżej nie skakał, gdy przycisk się doczyta. */}
      <div ref={box} className="flex min-h-[44px] w-full justify-center" aria-busy={busy} />
      {busy && <p className="text-sm text-muted">Logowanie…</p>}
      {error && (
        <Notice tone="error">Nie udało się zalogować przez Google. Spróbuj ponownie albo użyj e-maila.</Notice>
      )}
    </>
  )
}

/** Zapas: przekierowanie przez serwer Supabase (signInWithOAuth). */
function RedirectButton({ next }) {
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    setError(false)
    setBusy(true)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Powrót przez /logowanie, żeby przerwane logowanie pokazało komunikat.
        redirectTo: `${window.location.origin}/logowanie?next=${encodeURIComponent(next)}`,
        // Wybór konta przy każdym logowaniu — na wspólnym komputerze nie
        // wejdzie się przypadkiem na cudze konto Google.
        queryParams: { prompt: 'select_account' },
      },
    })
    if (authError) {
      setBusy(false)
      setError(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex h-14 w-full items-center justify-center gap-3 rounded border border-line bg-surface px-6 text-[15px] font-medium text-primary transition-colors hover:border-primary disabled:opacity-60"
      >
        <GoogleMark />
        {busy ? 'Przechodzę do Google…' : 'Kontynuuj z Google'}
      </button>
      {error && (
        <Notice tone="error">Nie udało się połączyć z Google. Spróbuj ponownie albo użyj e-maila.</Notice>
      )}
    </>
  )
}

/** Znak „G” w barwach Google — wymagany przez zasady marki na przyciskach logowania. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
