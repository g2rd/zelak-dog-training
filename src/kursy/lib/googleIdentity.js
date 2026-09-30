/**
 * Google Identity Services (GIS) — okienko logowania Google otwierane na
 * zelak.pl zamiast przekierowania przez serwer Supabase.
 *
 * DLACZEGO
 *
 * Przy przekierowaniu (signInWithOAuth) Google pokazuje „Przejdź do
 * aplikacji hrunmmmiemhukzhxlxbd.supabase.co” — adres, pod który wraca.
 * GIS działa na stronie, więc Google pokazuje zelak.pl, a gotowy token
 * przekazujemy do Supabase (signInWithIdToken). Przy okazji daje One Tap:
 * okienko „Kontynuuj jako …” bez szukania przycisku.
 *
 * Skrypt Google ładujemy WYŁĄCZNIE na stronach logowania i rejestracji —
 * wizytówka i reszta strefy nie kontaktują się z Google.
 */

const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

/** Identyfikator klienta OAuth z Google Cloud. Publiczny z założenia (jest w kodzie strony). */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

let loading = null

/** Ładuje skrypt GIS raz na sesję strony. Odrzuca po 8 s (np. blokada reklam). */
export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.defer = true
    const timer = setTimeout(() => reject(new Error('gis_timeout')), 8000)
    script.onload = () => {
      clearTimeout(timer)
      window.google?.accounts?.id ? resolve(window.google) : reject(new Error('gis_missing'))
    }
    script.onerror = () => {
      clearTimeout(timer)
      reject(new Error('gis_blocked'))
    }
    document.head.appendChild(script)
  }).catch((error) => {
    loading = null
    throw error
  })
  return loading
}

/**
 * Para jednorazowa: `raw` idzie do Supabase, `hashed` (SHA-256, hex) do
 * Google. Supabase sprawdza, że token Google powstał dla tego logowania —
 * przechwycony token z innej strony nie przejdzie.
 */
export async function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const raw = btoa(String.fromCharCode(...bytes))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return { raw, hashed }
}
