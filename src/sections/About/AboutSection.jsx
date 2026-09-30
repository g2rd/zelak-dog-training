import { useRef, useState } from 'react'
import { useScrollProgress, usePrefersReducedMotion } from '@/hooks/useScrollProgress'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Reveal } from '@/components/ui/Reveal'
import config from '@/data/site.config.json'

/**
 * Portret trenera.
 *
 * Zdjęcie jest już przygotowane jako czarno-białe (zgodnie z
 * brand.visualDirection.imageStyle) i z wyciszonymi światłami, więc nie
 * nakładamy filtra w CSS — plik wygląda tak samo w każdej przeglądarce.
 *
 * Oprawa: cienka ramka przesunięta o kilkanaście pikseli (brand: „geometryczne
 * obramowania"), delikatna paralaksa i wygaszenie dolnej krawędzi, żeby kadr
 * wtapiał się w czarne tło zamiast kończyć ostrym prostokątem.
 */
function AboutImage({ src, srcSet, alt }) {
  const [failed, setFailed] = useState(false)
  const wrapRef = useRef(null)
  const reduceMotion = usePrefersReducedMotion()
  const p = useScrollProgress(wrapRef)
  // -4% .. +4% w trakcie przewijania sekcji
  const shift = (p - 0.5) * 8

  if (failed) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded border border-line bg-surface">
        <span className="px-8 text-center font-heading text-[11px] uppercase tracking-wider text-muted">
          Miejsce na zdjęcie trenera z psem
        </span>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Przesunięta ramka — czysto dekoracyjna. */}
      <div
        aria-hidden="true"
        className="absolute -left-3 -top-3 h-full w-full rounded border border-line lg:-left-5 lg:-top-5"
      />

      <div className="relative overflow-hidden rounded border border-line">
        <img
          src={src}
          srcSet={srcSet}
          /* Obraz zajmuje pełną szerokość na telefonie, a od breakpointu lg
             połowę kontenera (max 1240 px) minus odstępy — stąd 560 px. */
          sizes="(max-width: 1023px) 92vw, 560px"
          alt={alt}
          loading="lazy"
          decoding="async"
          width="1200"
          height="1500"
          onError={() => setFailed(true)}
          style={reduceMotion ? undefined : { transform: `translate3d(0, ${shift}%, 0)` }}
          /* Skala 1.1 daje zapas na przesunięcie w paralaksie — bez niej
             przy krawędziach pokazałoby się puste tło. */
          className="aspect-[4/5] w-full scale-110 object-cover will-change-transform"
        />

        {/* Wygaszenie dolnej krawędzi w kolor sekcji. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink via-ink/50 to-transparent"
        />
      </div>
    </div>
  )
}

export function AboutSection() {
  const { eyebrow, headline, paragraphs, image, stats } = config.about

  return (
    <section id="o-mnie" className="section-spacing bg-ink">
      <div className="container-content grid gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="lg:pl-5 lg:pt-5">
          <AboutImage src={image.src} srcSet={image.srcSet} alt={image.alt} />
        </Reveal>

        <div className="flex flex-col gap-8">
          <Reveal>
            <SectionHeader eyebrow={eyebrow} headline={headline} />
          </Reveal>

          <Reveal delay={0.08}>
            <div className="flex flex-col gap-4">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="text-[15px] text-secondary sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <dl className="grid grid-cols-1 gap-6 border-t border-line pt-8 sm:grid-cols-2">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-heading text-3xl uppercase tracking-heading lg:text-4xl">
                    {stat.value}
                  </dd>
                  <p aria-hidden="true" className="text-sm text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
