import { SectionHeader } from '@/components/ui/SectionHeader'
import { IconFeature } from '@/components/ui/IconFeature'
import { Reveal } from '@/components/ui/Reveal'
import config from '@/data/site.config.json'

export function ValuesSection() {
  const { eyebrow, headline, items } = config.values

  return (
    <section id="wartosci" className="section-spacing bg-dark">
      <div className="container-content flex flex-col gap-14">
        <Reveal>
          <SectionHeader eyebrow={eyebrow} headline={headline} />
        </Reveal>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {items.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <IconFeature {...item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
