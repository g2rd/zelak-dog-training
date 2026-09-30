/**
 * Komunikaty Supabase Auth po polsku.
 *
 * Supabase zwraca błędy po angielsku i bez stabilnych kodów dla wszystkich
 * przypadków, więc dopasowujemy po fragmencie treści. Nieznany błąd dostaje
 * ogólny komunikat — techniczny opis widać w konsoli, nie na ekranie.
 */
const RULES = [
  [/invalid login credentials|invalid_credentials/i, 'Nieprawidłowy e-mail lub hasło.'],
  [/email not confirmed|email_not_confirmed/i, 'Potwierdź najpierw adres e-mail — sprawdź skrzynkę (także spam).'],
  [/user already registered|already been registered|user_already_exists/i, 'Konto z tym adresem już istnieje. Zaloguj się albo zresetuj hasło.'],
  [/password should be at least|weak_password|password is too weak/i, 'Hasło jest za słabe — użyj co najmniej 8 znaków.'],
  // Serwer poczty (SMTP) odrzucił wysyłkę. Supabase cofa wtedy rejestrację,
  // więc konto NIE powstaje — kursant może spokojnie spróbować ponownie.
  [/error sending|sending (confirmation|recovery|magic link) email|unexpected_failure.*email|smtp/i, 'Nie udało się wysłać e-maila z potwierdzeniem. Konto nie zostało założone — spróbuj ponownie za kilka minut albo napisz na kontakt@zelak.pl.'],
  [/rate limit|too many requests|over_email_send_rate_limit/i, 'Za dużo prób w krótkim czasie. Odczekaj chwilę i spróbuj ponownie.'],
  [/invalid email|unable to validate email|validation_failed/i, 'Ten adres e-mail wygląda na nieprawidłowy.'],
  [/same password|same_password/i, 'Nowe hasło musi się różnić od obecnego.'],
  [/otp_expired|token has expired|expired/i, 'Link wygasł. Poproś o nowy.'],
  [/failed to fetch|networkerror|network request failed/i, 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.'],
]

export function authErrorMessage(error) {
  if (!error) return ''
  const source = `${error.code ?? ''} ${error.message ?? ''}`
  for (const [pattern, message] of RULES) {
    if (pattern.test(source)) return message
  }
  console.error('[auth]', error)
  return 'Coś poszło nie tak. Spróbuj ponownie za chwilę.'
}

/** Ogólny komunikat dla błędów zapytań do bazy / funkcji. */
export function dataErrorMessage(error) {
  if (!error) return ''
  console.error('[dane]', error)
  if (/failed to fetch|networkerror/i.test(error.message ?? '')) {
    return 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.'
  }
  return 'Nie udało się pobrać danych. Odśwież stronę albo spróbuj za chwilę.'
}
