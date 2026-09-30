import { useState } from 'react'
import { ExternalLink, Hammer, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'
import config from '@/data/site.config.json'

/**
 * Mapa dojazdu na plac treningowy — ładowana dopiero po kliknięciu.
 *
 * DLACZEGO NIE ZWYKŁY <iframe> OD RAZU.
 *
 * Wydajność: osadzona mapa Google to ponad megabajt skryptów i kafelków oraz
 * połączenia do kilku domen Google. Wstawiona na stałe kosztowałaby większość
 * tego, co udało się wywalczyć w Core Web Vitals (wynik 97), a te są czynnikiem
 * rankingowym — czyli mapa szkodziłaby pozycji strony w wyszukiwarce.
 *
 * Prywatność: iframe wysyła adres IP odwiedzającego do Google, zanim ten
 * cokolwiek kliknie. Polityka prywatności tego serwisu mówi, że wszystkie
 * zasoby idą z naszego serwera — automatyczna mapa czyniłaby to zdanie
 * nieprawdziwym.
 *
 * Rozwiązanie: podgląd z adresem i przyciskiem. Iframe montuje się dopiero
 * wtedy, gdy użytkownik świadomie go poprosi. Kto nie kliknie, nie wysyła
 * do Google niczego.
 */
export function TrainingGroundMap({ className }) {
  const [loaded, setLoaded] = useState(false)
  const ground = config.trainingGround

  const embedSrc = `https://www.google.com/maps?q=${ground.lat},${ground.lng}&z=16&hl=pl&output=embed`

  return (
    <div className={cn('flex flex-col gap-5 rounded border border-line bg-surface p-6 lg:p-8', className)}>
      <div className="flex items-start gap-4">
        <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} />
        <div className="flex flex-col gap-1">
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
            Plac treningowy
          </span>
          <span className="text-base text-primary">{ground.name}</span>
          <span className="text-sm text-secondary">{ground.address}</span>
        </div>
      </div>

      {ground.notice && (
        <p className="flex items-start gap-3 rounded border border-line bg-dark p-4 text-sm text-secondary">
          <Hammer aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
          <span>{ground.notice}</span>
        </p>
      )}

      <div className="overflow-hidden rounded border border-line">
        {loaded ? (
          <iframe
            src={embedSrc}
            title={`Mapa dojazdu — ${ground.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            /* Mapa Google jest domyślnie jasna i na czarnej stronie razi.
               Odbarwienie plus lekkie przygaszenie wpisuje ją w monochromatyczny
               charakter serwisu (brand.visualDirection.imageStyle), a przy tym
               nie rusza czytelności — w odróżnieniu od inwersji kolorów, która
               odwraca też opisy ulic. Nie podoba się? Usuń klasę `map-tone`. */
            className="map-tone h-[280px] w-full border-0 sm:h-[340px]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="group flex h-[280px] w-full flex-col items-center justify-center gap-4 bg-dark px-6 text-center transition-colors hover:bg-ink sm:h-[340px]"
          >
            <MapPin
              aria-hidden="true"
              className="h-8 w-8 text-secondary transition-colors group-hover:text-primary"
              strokeWidth={1.25}
            />
            <span className="font-heading text-[12px] uppercase tracking-wider text-primary">
              Pokaż mapę dojazdu
            </span>
            <span className="max-w-[42ch] text-sm text-muted">
              Mapa wczytuje się z serwerów Google — dopiero po kliknięciu. Dzięki temu
              strona pozostaje szybka, a Twoje dane nie trafiają nigdzie bez Twojej zgody.
            </span>
          </button>
        )}
      </div>

      <a
        href={ground.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-heading text-[12px] uppercase tracking-wider text-primary transition-opacity hover:opacity-70"
      >
        Otwórz w Google Maps
        <ExternalLink aria-hidden="true" className="h-4 w-4" />
      </a>
    </div>
  )
}
