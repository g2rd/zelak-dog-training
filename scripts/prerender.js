/**
 * Prerendering — wstrzykuje gotowy HTML do dist/index.html.
 *
 * Po co: strona jest aplikacją React, więc bez tego kroku robot wyszukiwarki
 * dostaje pusty <div id="root"></div> i musi sam uruchomić JavaScript, żeby
 * zobaczyć treść. Google to potrafi, ale robi to z opóźnieniem, a część
 * innych robotów (Bing, boty social media, narzędzia SEO) słabiej.
 * Po prerenderingu każdy dostaje pełną treść od razu.
 *
 * Krok jest bezpieczny: jeżeli cokolwiek pójdzie nie tak, zostawiamy
 * dist/index.html bez zmian i build kończy się sukcesem — strona nadal
 * działa, po prostu bez prerenderu.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const root = path.dirname(url.fileURLToPath(import.meta.url)) + "/..";
const distIndex = path.join(root, "dist", "index.html");
const serverEntry = path.join(root, "dist-ssr", "entry-server.js");

// Trasy renderowane statycznie. Aliasy sekcji (/kontakt itd.) pomijamy —
// to przekierowania, nie osobne strony.
const ROUTES = [
  { url: "/", out: "index.html" },
  {
    url: "/polityka-prywatnosci",
    out: "polityka-prywatnosci/index.html",
    // Bez tego podstrona odziedziczyłaby <title> i canonical strony głównej —
    // dla wyszukiwarki wyglądałaby jak jej duplikat.
    title: "Polityka prywatności | ZELAK Dog Training",
    description:
      "Informacja o przetwarzaniu danych osobowych w serwisie zelak.pl — administrator, zakres, podstawa prawna i Twoje prawa.",
    canonical: "https://zelak.pl/polityka-prywatnosci/",
    noindex: true,
  },
  {
    url: "/regulamin",
    out: "regulamin/index.html",
    // Regulamin jest indeksowalny, w odróżnieniu od polityki prywatności:
    // ktoś, kto dostał kod od trenera, ma prawo przeczytać zasady bez
    // logowania i znaleźć je w wyszukiwarce.
    title: "Regulamin | ZELAK Dog Training",
    description:
      "Regulamin strefy kursów zelak.pl — konto, dostęp do kursów i planów szkoleniowych, kody dostępu, reklamacje i prawa autorskie.",
    canonical: "https://zelak.pl/regulamin/",
  },
];

// Strona 404 jako osobny plik.
//
// .htaccess oddaje ją przez ErrorDocument przy nieznanym adresie. Wcześniej
// wskazywał na index.html — serwer wysyłał wtedy HTML strony głównej, a React
// renderował stronę „nie znaleziono", więc hydratacja się nie zgadzała
// (React #418) i cała aplikacja przerzucała się na renderowanie po stronie
// klienta. Osobny plik usuwa niezgodność.
ROUTES.push({
  url: "/nie-znaleziono",
  out: "404.html",
  title: "Nie znaleziono strony | ZELAK Dog Training",
  description: "Strona o podanym adresie nie istnieje.",
  noindex: true,
});

// --- Strony miejskie -------------------------------------------------------
//
// Generowane z src/data/cities.json, żeby dopisanie miasta wymagało zmiany
// w JEDNYM miejscu. Każda dostaje własny <title>, opis, canonical oraz własny
// blok danych strukturalnych: Service z konkretnym `areaServed` i okruszki
// nawigacji. To one mówią Google, że strona dotyczy tego konkretnego miasta.
const cities = JSON.parse(
  fs.readFileSync(path.join(root, "src", "data", "cities.json"), "utf8"),
);
const phone = "+48572579595";

function cityJsonLd(city) {
  const url = `https://zelak.pl/szkolenie-psow-${city.slug}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: `Szkolenie psów ${city.name}`,
        description: city.lead,
        serviceType: "Szkolenie psów",
        provider: { "@id": "https://zelak.pl/#business" },
        areaServed: {
          "@type": "City",
          name: city.name,
          address: {
            "@type": "PostalAddress",
            addressLocality: city.name,
            addressRegion: "śląskie",
            addressCountry: "PL",
          },
        },
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: url,
          servicePhone: {
            "@type": "ContactPoint",
            telephone: phone,
            contactType: "customer service",
          },
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `Szkolenie psów ${city.name} — zakres`,
          itemListElement: [
            "Posłuszeństwo użytkowe",
            "Posłuszeństwo sportowe (IGP)",
            "Nosework, detekcja i tropienie",
            "Drive & Motivation",
            "Socjalizacja w mieście",
            "Konsultacje — zachowania trudne",
          ].map((n) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: n },
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Start",
            item: "https://zelak.pl/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `Szkolenie psów ${city.name}`,
            item: url,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `Szkolenie psów ${city.name} | Trener psów — ZELAK`,
        description: city.lead,
        inLanguage: "pl-PL",
        isPartOf: { "@id": "https://zelak.pl/#website" },
        about: { "@id": `${url}#service` },
      },
    ],
  };
}

for (const city of cities.cities) {
  ROUTES.push({
    url: `/szkolenie-psow-${city.slug}`,
    out: `szkolenie-psow-${city.slug}/index.html`,
    title: `Szkolenie psów ${city.name} | Trener psów — ZELAK`,
    description: `${city.focus} Posłuszeństwo, nosework i socjalizacja ${city.in}. Treningi indywidualne, plan dobrany do psa. Tel. +48 572 579 595.`,
    canonical: `https://zelak.pl/szkolenie-psow-${city.slug}/`,
    jsonLd: cityJsonLd(city),
  });
}

/**
 * Podmienia znaczniki <head> na wartości właściwe dla danej podstrony.
 *
 * DLACZEGO TE WYRAŻENIA SĄ ODPORNE NA BIAŁE ZNAKI, A KAŻDA PODMIANA JEST
 * SPRAWDZANA
 *
 * Pierwsza wersja dopasowywała znaczniki zapisane w jednej linii. Formatter
 * przepuszczony po `index.html` rozbił kilka z nich na trzy linie i dwie
 * podmiany przestały działać — po cichu, bo `String.replace` bez dopasowania
 * nie zgłasza błędu, tylko zwraca tekst bez zmian.
 *
 * Skutek był dotkliwy i niewidoczny: polityka prywatności oraz powłoka strefy
 * kursów straciły `noindex` i trafiłyby do wyszukiwarki, a wszystkie strony
 * miejskie dzieliły `og:title` ze stroną główną, czyli w mediach
 * społecznościowych pokazywały cudzy tytuł.
 *
 * Stąd `podmien()`: jeśli trasa deklaruje tytuł, canonical albo noindex,
 * a podmiana się nie wykonała, build PADA. Zła treść w <head> jest gorsza niż
 * przerwany build, bo o przerwanym buildzie wiadomo od razu.
 */
function podmien(html, wzorzec, zamiennik, opis) {
  const out = html.replace(wzorzec, zamiennik)
  if (out === html) {
    throw new Error(
      `nie udało się podmienić: ${opis}. Czy znacznik w index.html zmienił kształt ` +
        '(np. po przeformatowaniu)? Wyrażenie w applyHead wymaga aktualizacji.',
    )
  }
  return out
}

function applyHead(html, route) {
  let out = html

  if (route.title) {
    out = podmien(out, /<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`, '<title>')
    out = podmien(
      out,
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
      `$1${route.title}$2`,
      'og:title',
    )
  }

  if (route.description) {
    out = podmien(
      out,
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${route.description}$2`,
      'meta description',
    )
  }

  if (route.canonical) {
    out = podmien(
      out,
      /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
      `$1${route.canonical}$2`,
      'link canonical',
    )
    out = podmien(
      out,
      /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
      `$1${route.canonical}$2`,
      'og:url',
    )
  }

  if (route.noindex) {
    out = podmien(
      out,
      /(<meta\s+name="robots"\s+content=")[^"]*(")/,
      '$1noindex, follow$2',
      'meta robots (noindex)',
    )
  }

  // Dodatkowy blok danych strukturalnych właściwy dla podstrony.
  // Doklejamy go OBOK grafu z index.html, a nie zamiast — tamten opisuje firmę
  // (@id https://zelak.pl/#business) i strony miejskie się do niego odwołują.
  if (route.jsonLd) {
    const block =
      '    <script type="application/ld+json">' +
      String.fromCharCode(10) +
      JSON.stringify(route.jsonLd, null, 6) +
      String.fromCharCode(10) +
      '    </script>' +
      String.fromCharCode(10) +
      '</head>'
    out = podmien(out, /<\/head>/, block, 'wstrzyknięcie danych strukturalnych')
  }

  return out
}

async function main() {
  if (!fs.existsSync(serverEntry)) {
    console.warn("[prerender] brak dist-ssr/entry-server.js — pomijam");
    return;
  }

  let template = fs.readFileSync(distIndex, "utf8");

  // Preload czcionek widocznych nad linią załamania.
  //
  // Nazwy plików mają w sobie skrót treści (cache na rok), więc nie da się ich
  // wpisać na sztywno w index.html — dopisujemy je tutaj, po buildzie.
  //
  // Po co: bez preloadu przeglądarka odkrywa czcionkę dopiero po sparsowaniu
  // CSS, tekst pojawia się w czcionce zastępczej i podmienia z przeskokiem
  // układu (CLS). Preload skraca to okno prawie do zera.
  //
  // Oswald 600 = nagłówek H1 (element LCP), Inter 400 = tekst akapitów.
  // Warianty `latin-ext` są niezbędne dla polskich znaków ą ć ę ł ń ó ś ź ż.
  const FONT_PRELOAD = [
    /^oswald-latin-600-normal-.*\.woff2$/,
    /^oswald-latin-ext-600-normal-.*\.woff2$/,
    /^inter-latin-400-normal-.*\.woff2$/,
    /^inter-latin-ext-400-normal-.*\.woff2$/,
  ];

  const assetsDir = path.join(root, "dist", "assets");
  const fonts = fs.existsSync(assetsDir)
    ? fs
        .readdirSync(assetsDir)
        .filter((file) => FONT_PRELOAD.some((rx) => rx.test(file)))
        .map(
          (file) =>
            `    <link rel="preload" as="font" type="font/woff2" href="/assets/${file}" crossorigin />`,
        )
    : [];

  if (fonts.length) {
    // Dopasowanie po samym `</head>`, bez założeń o wcięciu.
    //
    // Wtyczka PWA dokleja swoje znaczniki tuż przed tym tagiem i BEZ nowej
    // linii, przez co literał "  </head>" przestał istnieć w wyniku builda.
    // `replace` bez dopasowania nic nie zgłasza, więc preload czcionek zniknął
    // po cichu — razem z nim wrócił narzut na LCP, który ten krok miał usunąć.
    template = podmien(
      template,
      /<\/head>/,
      fonts.join("\n") + "\n</head>",
      "preload czcionek",
    );
    console.log(`[prerender] preload czcionek: ${fonts.length} plikow`);
  } else {
    console.warn("[prerender] nie znalazlem plikow czcionek do preloadu");
  }
  const { render } = await import(url.pathToFileURL(serverEntry).href);

  for (const route of ROUTES) {
    const html = render(route.url);

    if (!html || html.length < 500) {
      console.warn(
        `[prerender] ${route.url}: podejrzanie krótki wynik, pomijam`,
      );
      continue;
    }

    const out = applyHead(
      template.replace('<div id="root"></div>', `<div id="root">${html}</div>`),
      route,
    );

    const target = path.join(root, "dist", route.out);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, out, "utf8");
    console.log(
      `[prerender] ${route.url} -> dist/${route.out} (${Math.round(out.length / 1024)} kB)`,
    );
  }

  // --- Powłoka strefy kursów -----------------------------------------------
  //
  // Strefa (/panel, /kursy, /konto, logowanie, płatności) NIE jest
  // prerenderowana: jej treść zależy od zalogowanego użytkownika, a adresy
  // mają `noindex`. Potrzebuje jednak własnego pliku HTML, bo `.htaccess`
  // kieruje na niego wszystkie adresy strefy (sekcja 1a).
  //
  // Kluczowa różnica wobec index.html: <div id="root"> zostaje PUSTY.
  // Gdyby strefa dostawała index.html z wstrzykniętą stroną główną, React
  // próbowałby zhydratować panel na treści wizytówki i hydratacja pękałaby
  // (React #418) — ten sam błąd, który wcześniej dotyczył strony 404.
  // Pusty #root sprawia, że main.jsx wybiera createRoot zamiast hydrateRoot.
  {
    const appShell = applyHead(template, {
      title: "Strefa kursów | ZELAK Dog Training",
      description:
        "Panel kursanta ZELAK Dog Training — Twoje kursy, zadania i postęp.",
      noindex: true,
    });
    fs.writeFileSync(path.join(root, "dist", "app.html"), appShell, "utf8");
    console.log(
      `[prerender] app.html — powłoka strefy kursów (${Math.round(appShell.length / 1024)} kB)`,
    );
  }

  // Sitemapa — generowana przy każdym buildzie, żeby data lastmod
  // odpowiadała realnej dacie publikacji, a nie dacie napisania pliku.
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: "https://zelak.pl/", priority: "1.0", freq: "weekly" },
    // Strony miejskie — wysoki priorytet, to one mają łapać ruch lokalny.
    ...cities.cities.map((c) => ({
      loc: `https://zelak.pl/szkolenie-psow-${c.slug}/`,
      priority: "0.9",
      freq: "monthly",
    })),
    { loc: "https://zelak.pl/regulamin/", priority: "0.3", freq: "yearly" },
    {
      loc: "https://zelak.pl/polityka-prywatnosci/",
      priority: "0.3",
      freq: "yearly",
    },
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(root, "dist", "sitemap.xml"), sitemap, "utf8");
  console.log(
    `[prerender] sitemap.xml (${urls.length} adresy, lastmod ${today})`,
  );

  // Katalog SSR nie jest do wgrywania na serwer.
  fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });
}

/**
 * Błąd prerenderu PRZERYWA build.
 *
 * Wcześniej był tu `console.warn` i build kończył się sukcesem. Wyglądało to
 * na rozsądną ostrożność — „w najgorszym razie strona pójdzie bez prerenderu".
 * W praktyce zamieniało każdą usterkę w cichy regres: podstrony wychodziły
 * z cudzym tytułem albo bez `noindex`, a wgrywały się normalnie, bo nic nie
 * krzyczało.
 *
 * Jedyny przypadek, który naprawdę wolno pominąć — brak `dist-ssr` — jest
 * obsłużony na początku `main()` i kończy się zwykłym `return`.
 */
main().catch((error) => {
  console.error("[prerender] BŁĄD, build przerwany:", error.message);
  process.exit(1);
});
