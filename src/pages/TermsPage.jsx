import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import config from '@/data/site.config.json'

/**
 * Regulamin strefy kursów.
 *
 * Dane usługodawcy są prawdziwe (G2RD, ul. Keplera 2, 41-800 Zabrze,
 * NIP 6482598475) — te same co w polityce prywatności.
 *
 * Od 24.09.2026 serwis niczego nie sprzedaje. Dostęp nadaje trener
 * (zatwierdzenie zgłoszenia albo kod), a rozlicza się z kursantem poza
 * serwisem — gotówką albo barterem. Dlatego zniknęły stąd cennik, operator
 * płatności i zgoda na utratę prawa odstąpienia: to były zasady sprzedaży
 * na odległość, a takiej sprzedaży już nie ma.
 *
 * UWAGA: to NIE jest dokument zweryfikowany prawnie. Opisuje faktyczny sposób
 * działania strefy. Jeśli wróci sprzedaż przez stronę, regulamin trzeba
 * napisać od nowa i dać do przejrzenia prawnikowi.
 */
export default function TermsPage() {
  const { email, phone } = config.contact.details

  return (
    <>
      <Seo
        title="Regulamin | ZELAK Dog Training"
        description="Regulamin strefy kursów zelak.pl — konto, dostęp do kursów i planów szkoleniowych, kody dostępu, reklamacje i prawa autorskie."
        canonical={`${config.seo.canonical}/regulamin/`}
      />

      <article className="section-spacing bg-ink pt-navbar">
        <div className="container-content flex max-w-[75ch] flex-col gap-10">
          <header className="flex flex-col gap-4">
            <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
              Dokumenty
            </span>
            <h1 className="text-3xl lg:text-5xl">Regulamin</h1>
            <p className="text-sm text-muted">
              Regulamin strefy kursów. Obowiązuje od 24 września 2026 r.
            </p>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">1. Usługodawca</h2>
            <p className="text-[15px] text-secondary">
              Usługodawcą jest <strong className="text-primary">G2RD</strong>, ul. Keplera 2,
              41-800 Zabrze, NIP 6482598475, prowadzący serwis pod adresem zelak.pl. Kontakt:{' '}
              <a className="underline" href={email.href}>{email.value}</a>,{' '}
              <a className="underline" href={phone.href}>{phone.value}</a>.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">2. Czym jest strefa kursów</h2>
            <p className="text-[15px] text-secondary">
              Strefa kursów to część serwisu dostępna po zalogowaniu. Zawiera plany szkoleniowe
              prowadzone razem z zajęciami na żywo — karty spotkań z zadaniami domowymi do
              odhaczania, notatkami i rozmową z trenerem — oraz kursy online złożone z lekcji
              z materiałem wideo lub instrukcją tekstową.
            </p>
            <p className="text-[15px] text-secondary">
              Materiały są pomocą edukacyjną. Nie zastępują indywidualnej konsultacji
              behawioralnej ani opieki weterynaryjnej, a efekty zależą od psa, przewodnika
              i systematyczności pracy.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">3. Konto</h2>
            <p className="text-[15px] text-secondary">
              Do korzystania ze strefy konieczne jest konto. Zakładając je, podajesz imię i adres
              e-mail oraz ustalasz hasło — albo logujesz się kontem Google, które przekazuje nam
              imię i adres e-mail. Konto jest bezpłatne, przypisane do jednej osoby i nie
              wolno udostępniać danych logowania osobom trzecim. Konto możesz usunąć w każdej
              chwili w zakładce „Konto"; usunięcie konta kasuje dostęp do kursów, dane psów
              i zapisany postęp.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">4. Dostęp i rozliczenie</h2>
            <p className="text-[15px] text-secondary">
              Serwis nie prowadzi sprzedaży. Dostęp do planu szkoleniowego lub kursu nadaje
              trener: zatwierdzając zgłoszenie psa albo przekazując kod dostępu. Warunki
              współpracy — w tym ewentualną zapłatę — ustalasz bezpośrednio z trenerem, poza
              serwisem.
            </p>
            <p className="text-[15px] text-secondary">
              Dostęp do planu szkoleniowego trwa{' '}
              <strong className="text-primary">3 miesiące</strong> od jego nadania, chyba że trener
              ustali inaczej; termin widzisz na stronie planu. Po jego upływie karty spotkań
              przestają być dostępne, ale Twoje odhaczenia, notatki i rozmowa z trenerem zostają
              zapisane i wracają po przedłużeniu dostępu.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">5. Kody dostępu</h2>
            <p className="text-[15px] text-secondary">
              Kod dostępu jest jednorazowy i otwiera dostęp jednemu psu. Jeżeli trener przypisał
              kod do adresu e-mail, zadziała on wyłącznie na koncie założonym na ten adres. Kodu
              nie wolno odsprzedawać ani publikować. Trener może unieważnić kod, który nie został
              jeszcze użyty.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">6. Reklamacje</h2>
            <p className="text-[15px] text-secondary">
              Jeżeli strefa nie działa prawidłowo — materiał się nie odtwarza, dostęp nie otworzył
              się mimo wpisania kodu, treść jest niezgodna z opisem — napisz na{' '}
              <a className="underline" href={email.href}>{email.value}</a>. Reklamację rozpatrujemy
              w terminie 14 dni od otrzymania. Odpowiedź wysyłamy na adres e-mail, z którego
              reklamacja wpłynęła.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">7. Prawa autorskie</h2>
            <p className="text-[15px] text-secondary">
              Wszystkie materiały strefy — nagrania, teksty, karty spotkań, plany treningowe — są
              chronione prawem autorskim i pozostają własnością usługodawcy. Dostęp daje prawo do
              korzystania z materiałów wyłącznie na własny użytek. Zabronione jest pobieranie,
              kopiowanie, publikowanie, odsprzedawanie i udostępnianie materiałów osobom trzecim,
              w tym dzielenie się kontem. Naruszenie tych zasad upoważnia usługodawcę do
              zablokowania dostępu.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">8. Wymagania techniczne</h2>
            <p className="text-[15px] text-secondary">
              Do korzystania ze strefy potrzebne jest urządzenie z dostępem do internetu, aktualna
              przeglądarka (Chrome, Safari, Firefox lub Edge) z włączoną obsługą JavaScript
              i plików cookies oraz czynny adres e-mail. Materiały wideo odtwarzane są w formie
              strumieniowej — wymagają stałego połączenia i nie są dostępne offline.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">9. Dane osobowe</h2>
            <p className="text-[15px] text-secondary">
              Zasady przetwarzania danych opisuje{' '}
              <Link className="underline" to="/polityka-prywatnosci">
                polityka prywatności
              </Link>
              . Do obsługi strefy korzystamy z podmiotów przetwarzających: Supabase (konta, baza
              danych i zdjęcia psów), Bunny.net (hosting wideo), Resend (e-maile) oraz Hostido
              (hosting serwisu).
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">10. Zmiany regulaminu</h2>
            <p className="text-[15px] text-secondary">
              Usługodawca może zmienić regulamin z ważnych przyczyn, w szczególności przy zmianie
              przepisów lub sposobu świadczenia usługi. O zmianach informujemy e-mailem
              z co najmniej 14-dniowym wyprzedzeniem.
            </p>
          </section>
        </div>
      </article>
    </>
  )
}
