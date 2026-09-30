import { Link, useLocation } from 'react-router-dom'
import { SocialLinks } from '@/components/ui/SocialLinks'
import { scrollToSection } from '@/utils/scrollToSection'
import config from '@/data/site.config.json'
import citiesData from '@/data/cities.json'

export function Footer() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const year = new Date().getFullYear()
  const { cities } = citiesData

  return (
    <footer className="border-t border-line bg-dark">
      <div className="container-content flex flex-col gap-12 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {/*
                Ten sam krążek co w navbarze (brand.badge), a nie biała sylwetka
                (brand.mark).

                Sylwetka to czysta biel na przezroczystości — zaprojektowana pod
                czarne tło i na jasnym po prostu znikała. Odwracanie jej filtrem
                dawało co prawda czerń, ale wtedy stopka i navbar pokazywały dwa
                różne znaki na jednej stronie. Krążek ma własne tło, więc czyta
                się na obu motywach i nie wymaga żadnej korekty.
              */}
              <img
                src={config.brand.badge.src}
                alt=""
                aria-hidden="true"
                className="h-12 w-12 shrink-0 rounded-full"
              />
              <span className="font-heading text-2xl uppercase tracking-wider text-primary">
                {config.brand.name}
              </span>
            </div>
            <p className="font-heading text-[11px] uppercase tracking-wider text-muted">
              {config.brand.tagline}
            </p>
          </div>

          <nav aria-label="Nawigacja w stopce" className="flex flex-col gap-3">
            {config.navigation.map((item) =>
              isHome ? (
                <a
                  key={item.target}
                  href={item.target}
                  onClick={(event) => {
                    if (scrollToSection(item.target)) event.preventDefault()
                  }}
                  className="font-heading text-[12px] uppercase tracking-wider text-secondary transition-colors hover:text-primary"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.target}
                  to={`/${item.target}`}
                  className="font-heading text-[12px] uppercase tracking-wider text-secondary transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex flex-col gap-3">
            <a
              href={config.contact.details.email.href}
              className="text-[15px] text-secondary transition-colors hover:text-primary"
            >
              {config.contact.details.email.value}
            </a>
            <a
              href={config.contact.details.phone.href}
              className="text-[15px] text-secondary transition-colors hover:text-primary"
            >
              {config.contact.details.phone.value}
            </a>

            <SocialLinks className="mt-2" />
          </div>
        </div>

        {/* Linki do stron miejskich w stopce — obecne na KAŻDEJ podstronie,
            więc Google trafia do nich z dowolnego miejsca w serwisie. */}
        <nav aria-label="Obszar działania" className="flex flex-col gap-4 border-t border-line pt-8">
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
            Szkolenie psów w miastach
          </span>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {cities.map((city) => (
              <li key={city.slug}>
                <Link
                  to={`/szkolenie-psow-${city.slug}/`}
                  className="text-sm text-secondary transition-colors hover:text-primary"
                >
                  {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            © {year} {config.footer.copyright}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {/*
              Wejście do strefy kursów.

              `rel="nofollow"` nie jest ozdobą. Stopka jest prerenderowana na
              każdej podstronie, więc bez tego robot wyszukiwarki zobaczyłby
              link do /kursy — adresu, który robots.txt blokuje przed
              odwiedzeniem. Zablokowany, a podlinkowany adres Google potrafi
              wciągnąć do wyników jako sam URL, bez tytułu i opisu. Do strefy
              za logowaniem nie ma czego indeksować.
            */}
            {config.footer.zone && (
              <Link
                to={config.footer.zone.path}
                rel="nofollow"
                className="text-sm text-muted transition-colors hover:text-primary"
              >
                {config.footer.zone.label}
              </Link>
            )}

            {config.footer.legal.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm text-muted transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
