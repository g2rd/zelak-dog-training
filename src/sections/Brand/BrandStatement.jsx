import { Reveal } from '@/components/ui/Reveal'
import config from '@/data/site.config.json'

/**
 * Pasek-manifest między heroem a sekcją "O mnie".
 */
export function BrandStatement() {
  const { headline, text } = config.statement

  return (
    <section id="intro" className="border-y border-line bg-dark">
      <div className="container-content flex flex-col items-center gap-6 py-20 text-center lg:py-24">
        <Reveal>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl">{headline}</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="max-w-[62ch] text-base text-secondary sm:text-lg">{text}</p>
        </Reveal>
      </div>
    </section>
  )
}
