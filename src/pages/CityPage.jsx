import { Link } from 'react-router-dom'
import { ArrowRight, Check, MapPin, Navigation } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Reveal } from '@/components/ui/Reveal'
import { TrainingGroundMap } from '@/components/ui/TrainingGroundMap'
import NotFoundPage from '@/pages/NotFoundPage'
import config from '@/data/site.config.json'
import services from '@/data/services.json'
import citiesData from '@/data/cities.json'

/**
 * Strona pod konkretne miasto — np. /szkolenie-psow-gliwice.
 *
 * Po co osobne strony zamiast jednej z listą miast: Google dopasowuje wynik do
 * zapytania. Zapytanie „szkolenie psów Gliwice" wygrywa strona, która JEST
 * o Gliwicach, a nie taka, która wymienia dwanaście miast w stopce.
 *
 * UWAGA na doorway pages. Strony różniące się wyłącznie podmienioną nazwą
 * miasta Google klasyfikuje jako spam i karze całą domenę. Dlatego treść tutaj
 * pochodzi z `cities.json`, gdzie każde miasto ma własny opis, własną listę
 * miejsc socjalizacji i własny akcent treningowy — realnie inne, bo w każdym
 * mieście pracuje się inaczej. Dopisując nowe miasto trzeba napisać treść,
 * a nie skopiować sąsiada.
 */
export function getCity(slug) {
  return citiesData.cities.find((c) => c.slug === slug)
}

export default function CityPage({ slug }) {
  const city = getCity(slug)

  // Nieznane miasto = zwykłe 404, nie pusta strona.
  if (!city) return <NotFoundPage />

  const { base } = citiesData
  const canonical = `${config.seo.canonical}/szkolenie-psow-${city.slug}/`
  const title = `Szkolenie psów ${city.name} | Trener psów — ZELAK`
  const description = `${city.focus} Posłuszeństwo, nosework i socjalizacja ${city.in}. Treningi indywidualne, plan dobrany do psa. Tel. ${config.contact.details.phone.value}.`

  return (
    <>
      <Seo title={title} description={description} canonical={canonical} />

      {/* ---------- nagłówek ---------- */}
      <section className="section-spacing bg-ink pt-navbar">
        <div className="container-content flex max-w-[70ch] flex-col gap-8">
          <nav aria-label="Ścieżka nawigacji">
            <ol className="flex flex-wrap items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted">
              <li>
                <Link to="/" className="transition-colors hover:text-primary">
                  Start
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-secondary">Szkolenie psów {city.name}</li>
            </ol>
          </nav>

          <Reveal immediate>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl">
              Szkolenie psów {city.name}
            </h1>
          </Reveal>

          <Reveal immediate delay={0.06}>
            <p className="text-base text-secondary sm:text-lg">{city.lead}</p>
          </Reveal>

          <Reveal immediate delay={0.12}>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" to="/#kontakt">
                Umów trening
              </Button>
              <Button size="lg" variant="outline" href={config.contact.details.phone.href}>
                Zadzwoń: {config.contact.details.phone.value}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- gdzie pracujemy w tym mieście ---------- */}
      <section className="section-spacing bg-dark">
        <div className="container-content grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <SectionHeader
              eyebrow={`Socjalizacja ${city.in}`}
              headline="Gdzie pracujemy"
              description="Socjalizacji nie da się przeprowadzić na pustym placu. Pies musi zmierzyć się z bodźcami, które faktycznie spotka w codziennym życiu — dlatego wychodzimy tam, gdzie jest ich najwięcej."
            />
          </Reveal>

          <Reveal delay={0.08}>
            <ul className="flex flex-col gap-4">
              {city.places.map((place) => (
                <li
                  key={place}
                  className="flex items-start gap-4 border-t border-line py-5 text-[15px] text-secondary"
                >
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                    strokeWidth={1.5}
                  />
                  <span>{place}</span>
                </li>
              ))}
              <li className="flex items-start gap-4 border-t border-line py-5 text-[15px] text-secondary">
                <Navigation
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  strokeWidth={1.5}
                />
                <span>
                  <strong className="text-primary">Komunikacja miejska.</strong>{' '}
                  {city.transport}
                </span>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------- jak wygląda współpraca ---------- */}
      <section className="section-spacing bg-ink">
        <div className="container-content flex flex-col gap-10">
          <Reveal>
            <SectionHeader
              eyebrow="Organizacja"
              headline={
                city.isBase
                  ? 'Zajęcia stacjonarne i wyjazdowe'
                  : `Jak to działa ${city.in}`
              }
            />
          </Reveal>

          <Reveal delay={0.06}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3 rounded border border-line bg-surface p-7">
                <h3 className="text-lg lg:text-xl">Zajęcia na placu</h3>
                <p className="text-[15px] text-secondary">
                  {city.isBase
                    ? 'Plac treningowy mam w Zabrzu. Tutaj pracujemy nad posłuszeństwem, pracą węchową i motywacją w warunkach, które da się kontrolować i powtórzyć.'
                    : `Plac treningowy mam w Zabrzu — to około ${city.travelMinutes} minut jazdy ${city.from}. Tam pracujemy nad podstawami w kontrolowanych warunkach, zanim wyjdziemy w miasto.`}
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded border border-line bg-surface p-7">
                <h3 className="text-lg lg:text-xl">Dojazd do Ciebie</h3>
                <p className="text-[15px] text-secondary">
                  {city.isBase
                    ? 'Na terenie Zabrza dojeżdżam bez dopłaty. Część zajęć i tak prowadzimy w mieście, bo tam pies faktycznie funkcjonuje.'
                    : `Dojeżdżam ${city.in} do klienta — za dodatkową opłatą, doliczaną do ceny treningu. Zajęcia odbywają się wtedy w Twojej okolicy: na osiedlu, w parku albo tam, gdzie pojawia się problem.`}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- mapa placu (tylko miasto bazowe) ---------- */}
      {city.isBase && (
        <section className="section-spacing bg-dark pt-0">
          <div className="container-content">
            <Reveal>
              <TrainingGroundMap className="mx-auto max-w-3xl" />
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- oferta ---------- */}
      <section className="section-spacing bg-dark">
        <div className="container-content flex flex-col gap-12">
          <Reveal>
            <SectionHeader
              eyebrow="Zakres"
              headline={`W czym mogę pomóc ${city.in}`}
              description={city.focus}
            />
          </Reveal>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {services.map((service, index) => (
              <Reveal
                key={service.id}
                delay={index * 0.05}
                className={service.featured ? 'md:col-span-2' : undefined}
              >
                <article className="flex h-full flex-col gap-4 rounded border border-line bg-surface p-6 transition-colors hover:border-primary lg:p-7">
                  <h3 className="text-lg lg:text-xl">{service.title}</h3>
                  <p className="text-[15px] text-secondary">{service.description}</p>
                  <ul className="mt-auto flex flex-col gap-2 pt-2">
                    {service.features.slice(0, 4).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-secondary"
                      >
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <Link
              to="/#oferta"
              className="inline-flex items-center gap-2 font-heading text-[12px] uppercase tracking-wider text-primary transition-opacity hover:opacity-70"
            >
              Pełna oferta i szczegóły
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- pozostałe miasta ---------- */}
      <section className="section-spacing bg-ink">
        <div className="container-content flex flex-col gap-8">
          <Reveal>
            <SectionHeader eyebrow="Obszar działania" headline="Pozostałe miasta" />
          </Reveal>

          <Reveal delay={0.06}>
            <ul className="flex flex-wrap gap-3">
              {citiesData.cities
                .filter((c) => c.slug !== city.slug)
                .map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={`/szkolenie-psow-${c.slug}/`}
                      className="inline-flex items-center rounded border border-line px-5 py-3 font-heading text-[12px] uppercase tracking-wider text-secondary transition-colors hover:bg-primary hover:text-ink"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="border-t border-line bg-dark">
        <div className="container-content py-20 lg:py-24">
          <Reveal>
            <div className="flex flex-col items-start gap-8 rounded border border-line bg-surface p-9 lg:flex-row lg:items-center lg:justify-between lg:p-14">
              <div className="flex flex-col gap-3">
                <h2 className="max-w-[24ch] text-2xl sm:text-3xl lg:text-4xl">
                  Zacznijmy pracę {city.in}
                </h2>
                <p className="max-w-[52ch] text-base text-secondary">
                  Opisz mi swojego psa i to, nad czym chcesz pracować. Powiem Ci, od czego
                  najlepiej zacząć i ile to zajmie.
                </p>
              </div>
              <Button size="lg" to="/#kontakt" className="shrink-0">
                Skontaktuj się
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export { citiesData }
