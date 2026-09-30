import { useEffect, useState } from 'react'

/**
 * Śledzi, która sekcja jest aktualnie widoczna, żeby podświetlić pozycję w menu.
 * IntersectionObserver zamiast nasłuchu na scroll — mniej pracy w głównym wątku.
 *
 * @param {string[]} sectionIds identyfikatory sekcji bez "#"
 * @returns {string} id aktywnej sekcji
 */
export function useActiveSection(sectionIds) {
  const [active, setActive] = useState(sectionIds[0] ?? '')

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el) => el !== null)

    if (elements.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sectionIds])

  return active
}
