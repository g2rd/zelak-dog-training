import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Czy zmienne środowiskowe Supabase są ustawione.
 *
 * Bez nich strefa kursów pokazuje komunikat o braku konfiguracji zamiast
 * wysypywać całą aplikację — strona wizytówka ma działać także wtedy, gdy
 * ktoś zbuduje projekt bez `.env.local` (np. lokalnie, przed założeniem
 * projektu Supabase).
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Jedyna instancja klienta Supabase (tylko klucze publiczne — patrz .env.example).
 *
 * Wartości zastępcze przy braku konfiguracji istnieją wyłącznie po to, żeby
 * `createClient` nie rzucił wyjątkiem w trakcie importu modułu. Żadne
 * zapytanie z nimi nie przejdzie, a interfejs i tak ich nie wywoła
 * (`isSupabaseConfigured` blokuje strefę).
 */
export const supabase = createClient(
  url || 'https://brak-konfiguracji.supabase.co',
  anonKey || 'brak-konfiguracji',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Linki z e-maili (potwierdzenie konta, reset hasła) wracają z tokenem
      // w adresie — klient przechwytuje go przy starcie i loguje użytkownika.
      detectSessionInUrl: true,
    },
  },
)
