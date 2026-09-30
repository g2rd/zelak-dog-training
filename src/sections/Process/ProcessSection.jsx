import { SectionHeader } from '@/components/ui/SectionHeader'
import { Reveal } from '@/components/ui/Reveal'
import config from '@/data/site.config.json'

export function ProcessSection() {
  const { eyebrow, headline, steps } = config.process

  return (
    <section id="proces" className="section-spacing bg-dark">
      <div className="container-content flex flex-col gap-14">
        <Reveal>
          <SectionHeader eyebrow={eyebrow} headline={headline} />
        </Reveal>

        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.06} as="li">
              <div className="flex h-full flex-col gap-4 border-t border-line pt-7">
                <span aria-hidden="true" className="font-heading text-4xl text-line">
                  {step.number}
                </span>
                <h3 className="text-lg lg:text-xl">{step.title}</h3>
                <p className="text-[15px] text-secondary">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
