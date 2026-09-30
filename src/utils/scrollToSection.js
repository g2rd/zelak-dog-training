/**
 * Przewija do sekcji o podanym selektorze kotwicy (np. "#kontakt").
 * Uwzględnia wysokość przyklejonego navbara i preferencję reduced-motion.
 *
 * @param {string} target selektor CSS, zwykle "#id"
 * @returns {boolean} true jeśli element istnieje na bieżącej stronie
 */
export function scrollToSection(target) {
  if (!target || !target.startsWith('#')) return false

  const element = document.querySelector(target)
  if (!element) return false

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const navbarHeight =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--navbar-height'),
      10,
    ) || 80

  const top = element.getBoundingClientRect().top + window.scrollY - navbarHeight

  window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' })

  // Kotwica trafia też do adresu URL, żeby dało się ją udostępnić.
  if (window.history.replaceState) {
    window.history.replaceState(null, '', target)
  }

  return true
}
