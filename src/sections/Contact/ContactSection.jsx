import { Mail, MapPin, Phone } from 'lucide-react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import { SocialLinks } from '@/components/ui/SocialLinks'
import { TrainingGroundMap } from '@/components/ui/TrainingGroundMap'
import config from '@/data/site.config.json'

/**
 * Kontakt bez formularza.
 *
 * Przycisk otwiera domyślny program pocztowy urządzenia (na telefonie —
 * aplikację poczty, na komputerze — klienta ustawionego w systemie) z już
 * wpisanym adresem odbiorcy i tematem.
 *
 * Ważne: `mailto:` bywa martwe, gdy ktoś nie ma skonfigurowanego programu
 * pocztowego. Dlatego adres e-mail i numer telefonu są też widoczne jako
 * osobne, klikalne pozycje wyżej — nawet jeśli przycisk nic nie zrobi,
 * kontakt jest na wierzchu do skopiowania.
 */
function ContactRow({ icon: Icon, label, value, href }) {
  const content = (
    <>
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} />
      <span className="flex flex-col gap-0.5">
        <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
          {label}
        </span>
        <span className="text-base text-primary">{value}</span>
      </span>
    </>
  )

  return href ? (
    <a
      href={href}
      className="flex items-start gap-4 border-t border-line py-5 transition-opacity hover:opacity-70"
    >
      {content}
    </a>
  ) : (
    <div className="flex items-start gap-4 border-t border-line py-5">{content}</div>
  )
}

export function ContactSection() {
  const { eyebrow, headline, description, details, cta } = config.contact

  const mailHref = cta.subject
    ? `mailto:${details.email.value}?subject=${encodeURIComponent(cta.subject)}`
    : `mailto:${details.email.value}`

  return (
    <section id="kontakt" className="section-spacing bg-dark">
      <div className="container-content grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-8">
          <Reveal>
            <SectionHeader eyebrow={eyebrow} headline={headline} description={description} />
          </Reveal>

          <Reveal delay={0.12}>
            <SocialLinks size="lg" />
          </Reveal>

          <Reveal delay={0.16}>
            <TrainingGroundMap />
          </Reveal>
        </div>

        <Reveal delay={0.06}>
          <div className="flex flex-col gap-8 rounded border border-line bg-surface p-5 sm:p-7 lg:p-10">
            <address className="flex flex-col not-italic">
              <ContactRow
                icon={Phone}
                label={details.phone.label}
                value={details.phone.value}
                href={details.phone.href}
              />
              <ContactRow
                icon={Mail}
                label={details.email.label}
                value={details.email.value}
                href={details.email.href}
              />
              <ContactRow
                icon={MapPin}
                label={details.location.label}
                value={details.location.value}
              />
            </address>

            {/* Na najwęższych telefonach (320 px) „Zadzwoń: +48 …” nie mieści się
                w jednej linii — przyciski mogą wtedy złamać tekst, zamiast
                rozpychać stronę w bok. */}
            <div className="flex flex-col gap-3">
              <Button size="lg" href={mailHref} className="h-auto min-h-14 w-full whitespace-normal py-3 text-center">
                {cta.label}
              </Button>
              <Button
                size="lg"
                variant="outline"
                href={details.phone.href}
                className="h-auto min-h-14 w-full whitespace-normal py-3 text-center"
              >
                Zadzwoń: <span className="whitespace-nowrap">{details.phone.value}</span>
              </Button>
            </div>

            <p className="text-sm text-muted">
              Przycisk otworzy Twój program pocztowy z wpisanym adresem. Jeśli nic się nie
              stanie, napisz ręcznie na{' '}
              <a href={details.email.href} className="text-secondary underline hover:text-primary">
                {details.email.value}
              </a>
              .
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
