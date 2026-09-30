import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import config from '@/data/site.config.json'

export function CTASection() {
  const { headline, text, cta } = config.ctaBanner

  return (
    <section id="cta-banner" className="border-y border-line bg-ink">
      <div className="container-content py-20 lg:py-24">
        <Reveal>
          <div className="flex flex-col items-start gap-8 rounded border border-line bg-surface p-9 lg:flex-row lg:items-center lg:justify-between lg:p-14">
            <div className="flex flex-col gap-3">
              <h2 className="max-w-[20ch] text-2xl sm:text-3xl lg:text-4xl">{headline}</h2>
              <p className="max-w-[52ch] text-base text-secondary">{text}</p>
            </div>
            <Button size="lg" target={cta.target} className="shrink-0">
              {cta.label}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
