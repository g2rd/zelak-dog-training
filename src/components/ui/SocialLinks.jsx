import { Facebook, Instagram, Music2, Youtube } from 'lucide-react'
import { cn } from '@/lib/cn'
import config from '@/data/site.config.json'

/**
 * Ikony serwisów społecznościowych.
 *
 * TikTok nie ma ikony w bibliotece Lucide, a odrysowywanie cudzego logotypu
 * nie jest dobrym pomysłem — dlatego domyślnie używamy neutralnej nuty.
 * Żeby wstawić oficjalną ikonę: wgraj plik do `public/assets/images/`
 * i podaj jego ścieżkę w `iconSrc` przy danym wpisie w site.config.json.
 */
const ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
}

export function SocialLinks({ size = 'md', className }) {
  // Wpis z enabled:false jest pomijany — tak chowamy profil, którego
  // jeszcze nie ma, bez usuwania go z konfiguracji.
  const items = config.contact.social.filter((item) => item.enabled !== false)

  if (items.length === 0) return null

  const box = size === 'lg' ? 'h-11 w-11' : 'h-10 w-10'
  const glyph = size === 'lg' ? 'h-4 w-4' : 'h-4 w-4'

  return (
    <ul className={cn('flex flex-wrap gap-3', className)}>
      {items.map((item) => {
        const Icon = ICONS[item.type]
        const isExternal = item.url.startsWith('http')

        return (
          <li key={item.type}>
            <a
              href={item.url}
              aria-label={item.label}
              title={item.label}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className={cn(
                'flex items-center justify-center rounded border border-line',
                'text-secondary transition-colors hover:bg-primary hover:text-ink',
                box,
              )}
            >
              {item.iconSrc ? (
                <img src={item.iconSrc} alt="" aria-hidden="true" className={glyph} />
              ) : Icon ? (
                <Icon aria-hidden="true" className={glyph} />
              ) : (
                <span aria-hidden="true" className="font-heading text-[11px] uppercase">
                  {item.label.slice(0, 2)}
                </span>
              )}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
