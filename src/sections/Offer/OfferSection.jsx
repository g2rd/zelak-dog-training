import { SectionHeader } from '@/components/ui/SectionHeader'
import { ServiceCard } from '@/components/ui/ServiceCard'
import { Reveal } from '@/components/ui/Reveal'
import config from '@/data/site.config.json'
import services from '@/data/services.json'

export function OfferSection() {
  const { eyebrow, headline, description } = config.offer

  return (
    <section id="oferta" className="section-spacing bg-ink">
      <div className="container-content flex flex-col gap-14">
        <Reveal>
          <SectionHeader eyebrow={eyebrow} headline={headline} description={description} />
        </Reveal>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {services.map((service, index) => (
            <Reveal
              key={service.id}
              delay={index * 0.06}
              className={service.featured ? 'h-full md:col-span-2' : 'h-full'}
            >
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
