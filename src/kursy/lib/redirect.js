/**
 * Adres, na który wracamy po zalogowaniu, gdy przychodzi z adresu strony
 * (`?next=/aktywuj`). Tylko ścieżka w obrębie zelak.pl: bez tego ktoś
 * mógłby rozesłać link `/logowanie?next=https://obca-strona.pl`, a nasz
 * serwis po zalogowaniu sam przeniósłby ofiarę na obcą stronę.
 *
 * @param {string|null|undefined} value
 * @param {string} fallback
 */
export function safeNext(value, fallback = '/panel') {
  if (typeof value !== 'string') return fallback
  // „//host” i „/\host” przeglądarka traktuje jak adres innej domeny.
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (/[\r\n]/.test(value)) return fallback
  return value
}
