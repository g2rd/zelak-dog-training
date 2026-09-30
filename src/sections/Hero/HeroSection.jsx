import { useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { useScrollProgress, usePrefersReducedMotion } from '@/hooks/useScrollProgress'
import config from '@/data/site.config.json'

/**
 * Ekran otwarcia.
 *
 * Tłem jest grafika marki w pełnym kadrze, animowana postępem przewijania:
 * przybliża się, przesuwa (paralaksa) i wygasza, kiedy sekcja opuszcza ekran.
 * Treść jedzie w przeciwną stronę — stąd wrażenie głębi.
 *
 * Krycie NIE jest animowane na kolumnie z treścią: przygaszony biały przycisk
 * CTA wyglądałby na nieaktywny.
 *
 * Przy prefers-reduced-motion żaden transform się nie stosuje. Systemowe
 * wyłączenie animacji (Windows: Ustawienia → Ułatwienia dostępu → Efekty
 * wizualne) daje więc statyczny kadr — tak ma być.
 */
export function HeroSection() {
  const { eyebrow, headline, subheadline, primaryCTA, secondaryCTA } = config.hero
  const sectionRef = useRef(null)
  const reduceMotion = usePrefersReducedMotion()
  const p = useScrollProgress(sectionRef)

  const bgStyle = reduceMotion
    ? { opacity: 0.5 }
    : {
        opacity: 0.6 - p * 0.55,
        transform: `translate3d(0, ${p * 26}%, 0) scale(${1 + p * 0.35})`,
      }

  const textStyle = reduceMotion ? undefined : { transform: `translate3d(0, ${p * -110}px, 0)` }

  return (
    <section
      id="start"
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden bg-ink pt-navbar"
    >
      {/* ---------- tło ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 will-change-transform" style={bgStyle}>
          {/*
            Grafika hero jako TŁO CSS, nie <img>.

            Pierwsza wersja używała dwóch elementów <picture> przełączanych
            przez display:none — i to był błąd, potwierdzony pomiarem ruchu
            sieciowego: `display:none` nie powstrzymuje przeglądarki przed
            pobraniem obrazu, więc każdy odwiedzający ściągał OBA komplety
            (+53 kB bez żadnego pożytku). Przy tle CSS przeglądarka pobiera
            wyłącznie plik z reguły, która wygrała — jeden, zawsze.

            Elementem LCP jest tutaj nagłówek H1, nie ta grafika (leży pod
            gradientem przy 60% krycia), więc brak atrybutu fetchpriority
            niczego nie psuje — przeciwnie, nie konkuruje już o pasmo
            z czcionką nagłówka.

            Warianty rozdzielczości i przełączanie motywu siedzą w globals.css
            (.hero-art), bo jedno i drugie to media query / selektor.
          */}
          <div aria-hidden="true" className="hero-art" />
        </div>

        {/* Przyciemnienie pod kolumną tekstu — kontrast wg WCAG. */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/55 to-ink lg:bg-gradient-to-r lg:from-ink lg:via-ink/80 lg:to-ink/5" />
        {/* Wygaszenie dolnej krawędzi — płynne wejście w kolejną sekcję. */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink via-ink/75 to-transparent" />
        <div className="grain absolute inset-0" />
      </div>

      {/* ---------- treść ---------- */}
      <div className="container-content relative z-10 w-full py-24 lg:py-28" style={textStyle}>
        <div className="flex max-w-[46rem] flex-col gap-8">
          <Reveal immediate>
            <span className="flex items-center gap-3 font-heading text-[11px] uppercase tracking-wider text-secondary">
              <span aria-hidden="true" className="h-px w-10 bg-secondary/50" />
              {eyebrow}
            </span>
          </Reveal>

          <Reveal immediate delay={0.06}>
            <h1 className="text-legible max-w-[19ch] text-4xl sm:text-6xl lg:text-7xl">
              {headline}
            </h1>
          </Reveal>

          <Reveal immediate delay={0.12}>
            <p className="text-legible-sm max-w-[52ch] text-base text-secondary sm:text-lg">
              {subheadline}
            </p>
          </Reveal>

          <Reveal immediate delay={0.18}>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" target={primaryCTA.target}>
                {primaryCTA.label}
              </Button>
              <Button size="lg" variant="outline" target={secondaryCTA.target}>
                {secondaryCTA.label}
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
