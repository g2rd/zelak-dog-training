import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Nie znaleziono strony | ZELAK Dog Training"
        description="Strona o podanym adresie nie istnieje."
        noindex
      />
      <section className="section-spacing bg-ink pt-navbar">
        <div className="container-content flex min-h-[50vh] flex-col items-start justify-center gap-6">
          <span className="font-heading text-6xl text-line lg:text-8xl">404</span>
          <h1 className="text-3xl lg:text-5xl">Tej strony tu nie ma</h1>
          <p className="max-w-[48ch] text-base text-secondary">
            Adres jest nieprawidłowy albo strona została przeniesiona. Wróć na stronę główną
            lub napisz do mnie bezpośrednio.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button to="/" size="lg">
              Strona główna
            </Button>
            <Button to="/#kontakt" size="lg" variant="outline">
              Kontakt
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
