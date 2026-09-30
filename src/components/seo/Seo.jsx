import { useEffect } from 'react'

function setMeta(attribute, key, content) {
  if (!content) return
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

/**
 * Minimalny menedżer meta tagów dla SPA — bez dodatkowej zależności.
 * Statyczne wartości domyślne są w index.html (widzi je crawler bez JS);
 * ten komponent nadpisuje je przy zmianie trasy.
 */
export function Seo({ title, description, canonical, noindex = false }) {
  useEffect(() => {
    if (title) document.title = title

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)

    let robots = document.head.querySelector('meta[name="robots"]')
    if (noindex) {
      if (!robots) {
        robots = document.createElement('meta')
        robots.setAttribute('name', 'robots')
        document.head.appendChild(robots)
      }
      robots.setAttribute('content', 'noindex, follow')
    } else if (robots) {
      robots.remove()
    }

    if (canonical) {
      let link = document.head.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', canonical)
    }
  }, [title, description, canonical, noindex])

  return null
}
