import { Seo } from '@/components/seo/Seo'
import config from '@/data/site.config.json'

/**
 * Polityka prywatności.
 *
 * Dane administratora są uzupełnione (G2RD, ul. Keplera 2, 41-800 Zabrze,
 * NIP 6482598475) — nie ma tu już żadnych pól do wypełnienia.
 *
 * UWAGA: to nadal nie jest dokument zweryfikowany prawnie. Treść opisuje
 * stan faktyczny serwisu (brak formularza, brak zewnętrznych zasobów poza
 * mapą ładowaną na żądanie), ale przed sporem czy kontrolą warto dać ją
 * do przejrzenia specjaliście RODO.
 */
export default function PrivacyPolicyPage() {
  const { email, phone } = config.contact.details

  return (
    <>
      <Seo
        title="Polityka prywatności | ZELAK Dog Training"
        description="Informacja o przetwarzaniu danych osobowych w serwisie zelak.pl."
        canonical={`${config.seo.canonical}/polityka-prywatnosci/`}
      />

      <article className="section-spacing bg-ink pt-navbar">
        <div className="container-content flex max-w-[75ch] flex-col gap-10">
          <header className="flex flex-col gap-4">
            <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
              Dokumenty
            </span>
            <h1 className="text-3xl lg:text-5xl">Polityka prywatności</h1>
            <p className="text-sm text-muted">
              Ostatnia aktualizacja: 25 września 2026 r.
            </p>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">1. Administrator danych</h2>
            <p className="text-[15px] text-secondary">
              Administratorem danych osobowych jest <strong className="text-primary">G2RD</strong>,
              ul. Keplera 2, 41-800 Zabrze, NIP 6482598475. Kontakt: <a className="underline" href={email.href}>{email.value}</a>,{' '}
              <a className="underline" href={phone.href}>{phone.value}</a>.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">2. Zakres i cel przetwarzania</h2>
            <p className="text-[15px] text-secondary">
              <strong className="text-primary">Strona informacyjna.</strong> Samo przeglądanie
              serwisu nie wymaga podania danych. Nie ma tu formularza kontaktowego — przycisk
              „Wyślij wiadomość" otwiera Twój program pocztowy z wpisanym adresem odbiorcy. Dane,
              które nam przekażesz (imię, adres e-mail, ewentualnie telefon i informacje o psie),
              trafiają do nas wyłącznie w treści wiadomości, którą sam wysyłasz, i służą do
              udzielenia odpowiedzi.
            </p>
            <p className="text-[15px] text-secondary">
              <strong className="text-primary">Strefa kursów.</strong> Jeżeli zakładasz konto,
              przetwarzamy dodatkowo: imię i adres e-mail (konto), hasło w postaci
              nieodwracalnego skrótu, dane psa, które sam wpiszesz (imię, rasa, data urodzenia
              i zdjęcie, jeśli je dodasz), informację o dostępie do kursów i planów szkoleniowych
              wraz z jego terminem, postęp (które zadania odhaczyłeś i kiedy), Twoje notatki,
              wiadomości wymienione z trenerem oraz zgodę marketingową wraz z datą jej wyrażenia.
              Jeżeli otrzymasz kod dostępu, zapisujemy, do jakiego adresu e-mail został przypisany
              i kiedy go użyłeś. W serwisie nie ma płatności — nie przetwarzamy danych kart ani
              kont bankowych.
            </p>
            <p className="text-[15px] text-secondary">
              <strong className="text-primary">Logowanie przez Google.</strong> Jeżeli zakładasz
              konto albo logujesz się przyciskiem „Kontynuuj z Google”, Google przekazuje nam Twoje
              imię i nazwisko, adres e-mail oraz informację, że adres jest potwierdzony. Nie
              dostajemy Twojego hasła ani dostępu do innych danych konta Google. Na stronach
              logowania i rejestracji — i tylko tam — wczytujemy w tym celu skrypt Google
              (accounts.google.com), który może zapisać w przeglądarce własne pliki cookie. Zasady,
              na jakich Google przetwarza dane po swojej stronie, opisuje polityka prywatności
              Google.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">3. Podstawa prawna</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] text-secondary">
              <li>
                Art. 6 ust. 1 lit. b RODO — wykonanie umowy: prowadzenie konta, udostępnianie
                kursu i planu szkoleniowego, zapisywanie postępu, kontakt z trenerem.
              </li>
              <li>
                Art. 6 ust. 1 lit. c RODO — obowiązek prawny: wystawianie i przechowywanie
                dokumentów księgowych.
              </li>
              <li>
                Art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes: prowadzenie
                korespondencji, obrona przed roszczeniami, zapobieganie nadużyciom (np.
                udostępnianiu konta).
              </li>
              <li>
                Art. 6 ust. 1 lit. a RODO — zgoda: wiadomości marketingowe. Zgodę możesz wycofać
                w każdej chwili w zakładce „Konto"; nie wpływa to na legalność wysyłek sprzed
                wycofania.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">4. Okres przechowywania</h2>
            <p className="text-[15px] text-secondary">
              Korespondencję przechowujemy przez okres niezbędny do obsługi zapytania,
              a następnie przez 3 lata od ostatniego kontaktu — to okres przedawnienia
              roszczeń związanych z prowadzoną działalnością gospodarczą. Dokumentacja
              księgowa (np. faktury za szkolenia i kursy) przechowywana jest przez 5 lat, licząc
              od końca roku podatkowego, w którym powstał obowiązek podatkowy.
            </p>
            <p className="text-[15px] text-secondary">
              Dane konta w strefie kursów przechowujemy tak długo, jak istnieje konto. Możesz je
              usunąć samodzielnie w zakładce „Konto" — kasujemy wtedy profil, dane i zdjęcia psów,
              postęp, notatki, wiadomości i dostęp do kursów. Wystawione faktury zostają u nas przez okres wymagany przepisami
              podatkowymi, niezależnie od usunięcia konta.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">5. Twoje prawa</h2>
            <p className="text-[15px] text-secondary">
              Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia lub
              ograniczenia przetwarzania, prawo sprzeciwu, prawo do przenoszenia danych
              oraz prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.
            </p>
            <p className="text-[15px] text-secondary">
              Konto w strefie kursów usuniesz samodzielnie: zakładka{' '}
              <strong className="text-primary">Konto → Usunięcie konta</strong>. Jeśli wolisz,
              zrobimy to na Twoją prośbę wysłaną na{' '}
              <a className="underline" href={email.href}>{email.value}</a>.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">6. Pliki cookies i analityka</h2>
            <p className="text-[15px] text-secondary">
              Serwis nie używa plików cookies do celów analitycznych ani marketingowych i
              nie profiluje użytkowników. Jeżeli w przyszłości zostanie włączona analityka,
              ta sekcja oraz mechanizm zgody zostaną odpowiednio uzupełnione.
            </p>
            <p className="text-[15px] text-secondary">
              W strefie kursów Twoja przeglądarka przechowuje token sesji — bez niego logowanie nie
              działa. Jest to pamięć niezbędna do świadczenia usługi, o którą sam prosisz, więc nie
              wymaga zgody. Zapisujemy też lokalnie wybrany motyw strony (jasny lub ciemny). Żadna
              z tych informacji nie służy do śledzenia ani do reklamy.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl lg:text-2xl">7. Hosting i odbiorcy danych</h2>
            <p className="text-[15px] text-secondary">
              Strona oraz poczta elektroniczna są hostowane przez Hostido (Hostido sp. z o.o.),
              działającego jako podmiot przetwarzający na podstawie umowy powierzenia.
              Czcionki i wszystkie pozostałe zasoby serwowane są z naszego serwera.
            </p>
            <p className="text-[15px] text-secondary">
              Do obsługi strefy kursów online korzystamy z następujących podmiotów
              przetwarzających:
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] text-secondary">
              <li>
                <strong className="text-primary">Supabase</strong> — konta użytkowników, baza
                danych kursów i zdjęcia psów. Dane przechowywane w regionie Unii Europejskiej (Frankfurt).
              </li>
              <li>
                <strong className="text-primary">Bunny.net</strong> — hosting i strumieniowanie
                nagrań kursu. Odtworzenie filmu wiąże się z przekazaniem adresu IP do tej usługi.
              </li>
              <li>
                <strong className="text-primary">Resend</strong> — wysyłka e-maili
                transakcyjnych: potwierdzenie rejestracji i reset hasła.
              </li>
              <li>
                <strong className="text-primary">Hostido</strong> — hosting serwisu i poczta
                w domenie zelak.pl.
              </li>
            </ul>
            <p className="text-[15px] text-secondary">
              Część z tych podmiotów ma siedzibę lub infrastrukturę poza Europejskim Obszarem
              Gospodarczym. Przekazanie danych odbywa się wtedy na podstawie standardowych klauzul
              umownych zatwierdzonych przez Komisję Europejską.
            </p>
            <p className="text-[15px] text-secondary">
              Jedynym wyjątkiem jest <strong className="text-primary">mapa dojazdu</strong> na
              plac treningowy. Wczytuje się ona z serwerów Google (Google Ireland Limited)
              i wiąże się z przekazaniem Twojego adresu IP do Google, również poza Europejski
              Obszar Gospodarczy. Dlatego mapa <strong className="text-primary">nie ładuje
              się automatycznie</strong> — dopóki nie klikniesz przycisku „Pokaż mapę
              dojazdu", żadne dane nie są do Google wysyłane. Alternatywnie możesz otworzyć
              lokalizację bezpośrednio w aplikacji Google Maps.
            </p>
          </section>
        </div>
      </article>
    </>
  )
}
