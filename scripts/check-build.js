/**
 * Kontrola gotowego builda — uruchamiana po `npm run build`.
 *
 * Testy jednostkowe sprawdzają logikę. Ten skrypt sprawdza rzeczy, które
 * psują się dopiero w pliku wynikowym i których żaden test jednostkowy nie
 * zobaczy: co trafia do paczki wizytówki, czy powłoka strefy ma pusty korzeń,
 * czy prerendering faktycznie wstawił treść, czy w plikach nie ma sekretów.
 *
 * Każda z tych kontroli odpowiada usterce, która już wystąpiła albo która
 * ujawniłaby się dopiero na produkcji.
 *
 * Uruchomienie: node scripts/check-build.js   (albo `npm run test:build`)
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const root = path.dirname(url.fileURLToPath(import.meta.url)) + '/..'
const dist = path.join(root, 'dist')

let bledy = 0
let sprawdzone = 0

function ok(opis) {
  sprawdzone += 1
  console.log(`  OK    ${opis}`)
}

function blad(opis, szczegol) {
  sprawdzone += 1
  bledy += 1
  console.error(`  BŁĄD  ${opis}`)
  if (szczegol) console.error(`        ${szczegol}`)
}

function sprawdz(warunek, opis, szczegol) {
  if (warunek) ok(opis)
  else blad(opis, szczegol)
}

function czytaj(wzgledna) {
  const p = path.join(dist, wzgledna)
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null
}

if (!fs.existsSync(dist)) {
  console.error('Brak katalogu dist/. Uruchom najpierw `npm run build`.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
console.log('\n[1] Pliki, które muszą istnieć')
// ---------------------------------------------------------------------------
const wymagane = [
  'index.html',
  'app.html',
  '404.html',
  '.htaccess',
  'robots.txt',
  'sitemap.xml',
  'regulamin/index.html',
  'polityka-prywatnosci/index.html',
]
for (const plik of wymagane) {
  sprawdz(czytaj(plik) !== null, plik, 'plik nie powstał podczas budowania')
}

// ---------------------------------------------------------------------------
console.log('\n[2] Wizytówka nie pobiera kodu strefy kursów')
//
// Regresja, która już raz wystąpiła. `react/jsx-runtime` to osobne wejście
// pakietu React i wpis 'react' w podziale paczek go nie obejmował, więc Rollup
// dokleił go do chunku strefy. Wizytówka zaczęła importować ten chunk
// statycznie, żeby dostać funkcję `jsx` — i każdy odwiedzający stronę ofertową
// pobierał 382 kB supabase-js oraz React Query.
//
// Szukamy po wewnętrznych nazwach z bibliotek, a NIE po słowie „supabase":
// to ostatnie występuje w treści regulaminu jako nazwa podmiotu
// przetwarzającego i dawało fałszywy alarm.
// ---------------------------------------------------------------------------
const ZNACZNIKI_STREFY = ['GoTrueClient', 'PostgrestClient', 'QueryClient', 'micromark']
const assetsDir = path.join(dist, 'assets')
const pliki = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js')) : []

const chunkiStrefy = pliki.filter((f) => {
  const tresc = fs.readFileSync(path.join(assetsDir, f), 'utf8')
  return ZNACZNIKI_STREFY.some((z) => tresc.includes(z))
})

sprawdz(
  chunkiStrefy.length > 0,
  'chunk strefy kursów istnieje i daje się rozpoznać',
  'żaden plik nie zawiera znaczników bibliotek strefy — zmieniły się nazwy? kontrola niżej straciłaby sens',
)

const indexHtml = czytaj('index.html') ?? ''
const ladowaneOdRazu = [...indexHtml.matchAll(/(?:href|src)="\/assets\/([^"]+\.js)"/g)].map((m) => m[1])

sprawdz(
  ladowaneOdRazu.length > 0,
  `strona główna ładuje ${ladowaneOdRazu.length} plików JS`,
  'nie znaleziono żadnego skryptu — czy prerendering się powiódł?',
)

for (const plik of ladowaneOdRazu) {
  const tresc = fs.readFileSync(path.join(assetsDir, plik), 'utf8')
  const znalezione = ZNACZNIKI_STREFY.filter((z) => tresc.includes(z))
  sprawdz(
    znalezione.length === 0,
    `${plik} nie zawiera kodu strefy`,
    `znaleziono: ${znalezione.join(', ')} — wizytówka pobiera bibliotekę, której nie używa`,
  )
}

// ---------------------------------------------------------------------------
console.log('\n[3] Powłoka strefy (app.html)')
//
// #root MUSI być pusty. Gdyby strefa dostawała index.html z wstrzykniętą
// stroną główną, React próbowałby zhydratować panel na treści wizytówki
// i hydratacja pękałaby (React #418) — ten sam błąd, który wcześniej
// dotyczył strony 404.
// ---------------------------------------------------------------------------
const appHtml = czytaj('app.html') ?? ''
sprawdz(
  /<div id="root"><\/div>/.test(appHtml),
  'app.html ma pusty <div id="root">',
  'korzeń zawiera treść — hydratacja strefy pęknie (React #418)',
)
sprawdz(
  /<meta\s+name="robots"\s+content="noindex/.test(appHtml),
  'app.html ma noindex',
  'strefa za logowaniem nie może być indeksowana',
)
sprawdz(
  appHtml.includes('/assets/') && appHtml.includes('.js'),
  'app.html dowiązuje skrypty aplikacji',
  'bez skryptów strefa byłaby pustą stroną',
)

// ---------------------------------------------------------------------------
console.log('\n[4] Prerendering wizytówki')
// ---------------------------------------------------------------------------
sprawdz(
  !/<div id="root"><\/div>/.test(indexHtml),
  'index.html ma wstrzykniętą treść',
  'pusty korzeń oznacza, że prerendering się nie wykonał — robot zobaczy pustą stronę',
)
sprawdz(
  !indexHtml.includes('Ładowanie strefy kursów'),
  'index.html nie zawiera ekranu ładowania',
  'do HTML trafił komunikat z Suspense zamiast treści strony',
)

const regulamin = czytaj('regulamin/index.html') ?? ''
sprawdz(
  regulamin.includes('<title>Regulamin'),
  'regulamin ma własny tytuł',
  'podstrona odziedziczyła tytuł strony głównej — dla wyszukiwarki to duplikat',
)
sprawdz(
  !/<meta\s+name="robots"\s+content="noindex/.test(regulamin),
  'regulamin jest indeksowalny',
  'regulamin musi być dostępny publicznie, także bez logowania',
)

const polityka = czytaj('polityka-prywatnosci/index.html') ?? ''
sprawdz(
  /<meta\s+name="robots"\s+content="noindex/.test(polityka),
  'polityka prywatności ma noindex',
  'to ustawienie jest celowe — nie usuwać',
)

// ---------------------------------------------------------------------------
console.log('\n[5] Reguły serwera i robotów')
// ---------------------------------------------------------------------------
const htaccess = czytaj('.htaccess') ?? ''
sprawdz(
  htaccess.includes('/app.html'),
  '.htaccess kieruje strefę na app.html',
  'bez tej reguły adresy strefy zwrócą 404 po wdrożeniu',
)
sprawdz(
  htaccess.includes('ErrorDocument 404 /404.html'),
  '.htaccess obsługuje prawdziwe 404',
  null,
)

const robots = czytaj('robots.txt') ?? ''
for (const prefix of ['panel', 'kursy', 'konto', 'logowanie', 'aktywuj']) {
  sprawdz(
    robots.includes(`Disallow: /${prefix}`),
    `robots.txt blokuje /${prefix}`,
    'adres strefy byłby indeksowany',
  )
}

const sitemap = czytaj('sitemap.xml') ?? ''
const strefaWSitemap = ['/panel', '/konto', '/logowanie', '/aktywuj'].filter((p) =>
  sitemap.includes(`https://zelak.pl${p}`),
)
sprawdz(
  strefaWSitemap.length === 0,
  'sitemap.xml nie wymienia adresów strefy',
  `znaleziono: ${strefaWSitemap.join(', ')}`,
)

// ---------------------------------------------------------------------------
console.log('\n[6] Czy do paczki nie wyciekł sekret')
//
// Do przeglądarki wolno wysłać wyłącznie klucze publiczne. Klucz service_role
// omija wszystkie polityki bezpieczeństwa bazy. Wzorce Stripe zostają, choć
// płatności usunięto — kosztują nic, a stary klucz mógł zostać w czyimś .env.
// Pomyłka w jednym imporcie wystarczy.
// ---------------------------------------------------------------------------
const WZORCE = [
  [/\bsk_live_[A-Za-z0-9]/, 'klucz produkcyjny Stripe'],
  [/\bsk_test_[A-Za-z0-9]/, 'klucz testowy Stripe'],
  [/\bwhsec_[A-Za-z0-9]/, 'sekret webhooka Stripe'],
  [/\bsb_secret_[A-Za-z0-9]/, 'sekretny klucz Supabase'],
  [/SUPABASE_SERVICE_ROLE_KEY/, 'nazwa zmiennej z kluczem service_role'],
  [/"role"\s*:\s*"service_role"/, 'token z rolą service_role'],
]

function wszystkiePliki(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const pelna = path.join(dir, e.name)
    return e.isDirectory() ? wszystkiePliki(pelna) : [pelna]
  })
}

const doPrzeskanowania = wszystkiePliki(dist).filter((f) => /\.(js|html|css|json|txt|xml)$/.test(f))
const znalezioneSekrety = []
for (const plik of doPrzeskanowania) {
  const tresc = fs.readFileSync(plik, 'utf8')
  for (const [wzorzec, opis] of WZORCE) {
    if (wzorzec.test(tresc)) {
      znalezioneSekrety.push(`${path.relative(dist, plik)}: ${opis}`)
    }
  }
}
sprawdz(
  znalezioneSekrety.length === 0,
  `przeskanowano ${doPrzeskanowania.length} plików pod kątem sekretów`,
  znalezioneSekrety.join('\n        '),
)

// ---------------------------------------------------------------------------
console.log('\n[7] Konfiguracja Supabase wpisana do paczki')
//
// Vite wstawia zmienne VITE_* do plików wynikowych W CHWILI BUDOWANIA.
// Build bez nich kompiluje się bez błędu i wygląda normalnie — tylko strefa
// kursów pokazuje wtedy ekran „nie skonfigurowano". Wdrożenie takiej paczki
// na produkcję oznacza, że każdy klient traci dostęp do wykupionego kursu,
// a w logach nie ma ani jednego błędu.
//
// Dlatego na gałęzi produkcyjnej brak konfiguracji to BŁĄD, a nie ostrzeżenie.
// Steruje tym zmienna EXPECT_SUPABASE_CONFIG ustawiana w workflow.
// ---------------------------------------------------------------------------
const wymaganaKonfiguracja = process.env.EXPECT_SUPABASE_CONFIG === '1'

// Adres zastępczy z src/lib/supabase.js MUSI być wykluczony.
//
// Pierwsza wersja tej kontroli szukała po prostu ciągu „.supabase.co" i przez
// to przechodziła nawet przy buildzie bez żadnych kluczy — dopasowywała się do
// `https://brak-konfiguracji.supabase.co`, czyli do wartości awaryjnej, która
// istnieje po to, żeby `createClient` nie wywrócił się przy imporcie modułu.
// Kontrola wyglądała na działającą i nie chroniła przed niczym. Wyszło to
// dopiero przy próbie celowego zepsucia builda.
const ADRES_PROJEKTU = /https:\/\/(?!brak-konfiguracji)[a-z0-9-]{8,}\.supabase\.co/

const zKonfiguracja = pliki.filter((f) =>
  ADRES_PROJEKTU.test(fs.readFileSync(path.join(assetsDir, f), 'utf8')),
)

if (wymaganaKonfiguracja) {
  sprawdz(
    zKonfiguracja.length > 0,
    'paczka zawiera adres projektu Supabase',
    'build powstał bez VITE_SUPABASE_URL — po wdrożeniu strefa kursów byłaby martwa. ' +
      'Sprawdź sekrety repozytorium.',
  )
} else if (zKonfiguracja.length > 0) {
  ok(`paczka zawiera adres projektu Supabase (${zKonfiguracja.length} plik/i)`)
} else {
  console.log(
    '  INFO  paczka zbudowana BEZ konfiguracji Supabase — strefa kursów pokaże\n' +
      '        ekran „nie skonfigurowano". Dla gałęzi roboczej to dopuszczalne.',
  )
}

// ---------------------------------------------------------------------------
console.log('\n[8] Znaczniki wstrzykiwane do <head>')
//
// Trzy podmiany w scripts/prerender.js działają przez dopasowanie tekstu
// w gotowym HTML-u. Każda z nich już raz przestała działać po cichu: dwie po
// przeformatowaniu index.html, a trzecia po dodaniu wtyczki PWA, która dokleja
// swoje znaczniki tuż przed </head> i skasowała wzorzec z wcięciem.
//
// `String.replace` bez dopasowania nie zgłasza błędu — zwraca tekst bez zmian.
// Skutkiem były: podstrony bez `noindex`, strony miejskie z cudzym `og:title`
// i bez własnych danych strukturalnych oraz brak preloadu czcionek, czyli
// powrót narzutu na LCP. Wszystko wgrywało się normalnie.
// ---------------------------------------------------------------------------
const preloady = (indexHtml.match(/rel="preload" as="font"/g) ?? []).length
sprawdz(
  preloady > 0,
  `strona główna preloaduje czcionki (${preloady})`,
  'preload zniknął — wraca skok układu i gorszy wynik LCP',
)

const miasto = czytaj('szkolenie-psow-gliwice/index.html') ?? ''
const ldGlowna = (indexHtml.match(/application\/ld\+json/g) ?? []).length
const ldMiasto = (miasto.match(/application\/ld\+json/g) ?? []).length
sprawdz(
  ldMiasto > ldGlowna,
  `strona miejska ma własne dane strukturalne (${ldMiasto} bloki wobec ${ldGlowna})`,
  'wstrzyknięcie JSON-LD nie zadziałało — strony miejskie tracą to, po co powstały',
)
sprawdz(
  miasto.includes('szkolenie-psow-gliwice/#service'),
  'dane strukturalne strony miejskiej dotyczą tego miasta',
  null,
)

function ogTitle(html) {
  return html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/)?.[1] ?? ''
}
sprawdz(
  ogTitle(miasto) !== '' && ogTitle(miasto) !== ogTitle(indexHtml),
  'strona miejska ma własny og:title',
  `odziedziczyła tytuł strony głównej: "${ogTitle(indexHtml)}" — tak wyglądałaby po udostępnieniu w mediach społecznościowych`,
)

// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(60)}`)
if (bledy === 0) {
  console.log(`Kontrola builda: ${sprawdzone} sprawdzeń, wszystkie przeszły.`)
  process.exit(0)
}
console.error(`Kontrola builda: ${bledy} z ${sprawdzone} sprawdzeń NIE przeszło.`)
process.exit(1)
