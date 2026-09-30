import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Reveal } from '@/components/ui/Reveal'
import citiesData from '@/data/cities.json'

/**
 * Obszar działania — kafle z linkami do stron miejskich.
 *
 * To nie jest ozdoba, tylko linkowanie wewnętrzne. Google odkrywa podstrony
 * przede wszystkim przez linki ze stron, które już zna. Strona miejska
 * niepodlinkowana ze strony głównej to strona osierocona: jest w sitemapie,
 * ale bez sygnału, że ma jakiekolwiek znaczenie.
 */
export function AreaSection() {
  const { cities } = citiesData

  return (
    <section id="obszar" className="section-spacing bg-ink">
      <div className="container-content flex flex-col gap-12">
        <Reveal>
          <SectionHeader
            eyebrow="Obszar działania"
            headline="Szkolenie psów na Śląsku — gdzie pracuję"
            description="Plac treningowy mam w Zabrzu, ale socjalizację prowadzimy tam, gdzie pies faktycznie funkcjonuje — w galeriach, na rynkach, w autobusach i tramwajach. Do klienta w innych miastach dojeżdżam za dodatkową opłatą."
          />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city, index) => (
            <Reveal key={city.slug} delay={index * 0.05}>
              <Link
                to={`/szkolenie-psow-${city.slug}/`}
                className="group flex h-full flex-col gap-3 rounded border border-line bg-surface p-6 transition-colors hover:border-primary"
              >
                <span className="flex items-start justify-between gap-3">
                  {/* Tekst linku to pełna fraza „Szkolenie psów <miasto>", a nie
                      sama nazwa miasta. Anchor text jest jednym z mocniejszych
                      sygnałów tematu strony docelowej — link podpisany „Gliwice"
                      mówi Google o Gliwicach, nie o szkoleniu psów w Gliwicach.
                      Wizualnie nadal dominuje nazwa miasta. */}
                  <span className="flex flex-col">
                    <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
                      Szkolenie psów
                    </span>
                    <span className="font-heading text-xl uppercase tracking-heading text-primary">
                      {city.name}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-secondary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
                <span className="text-[15px] text-secondary">{city.focus}</span>
                <span className="mt-auto pt-2 font-heading text-[11px] uppercase tracking-wider text-muted">
                  {city.isBase ? 'Plac treningowy' : `Dojazd ok. ${city.travelMinutes} min`}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
