import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import TermsPage from '@/pages/TermsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import CityPage from '@/pages/CityPage'
import citiesData from '@/data/cities.json'
import { lazyZone } from '@/kursy/lazy'
import { ZoneFallback } from '@/kursy/ZoneFallback'

// Sekcje strony głównej dostępne również jako osobne adresy.
const SECTION_ALIASES = ['start', 'o-mnie', 'oferta', 'proces', 'kontakt']

// --- Strefa kursów ---------------------------------------------------------
//
// Jedyne miejsce w projekcie z React.lazy — i to wyjątek od reguły opisanej
// niżej, nie jej złamanie. Strefa nie jest prerenderowana (treść zależy od
// zalogowanego użytkownika, adresy mają noindex), więc `renderToString` nigdy
// jej nie dotyka. Wszystkie te komponenty pochodzą z jednego modułu
// `@/kursy/index`, więc powstaje z nich JEDEN chunk — wizytówka nie ciągnie
// ani bajta z supabase-js.
const ZoneProviders = lazyZone('ZoneProviders')
const ProtectedRoute = lazyZone('ProtectedRoute')
const StrefaLayout = lazyZone('StrefaLayout')
const LoginPage = lazyZone('LoginPage')
const RegisterPage = lazyZone('RegisterPage')
const ResetPasswordPage = lazyZone('ResetPasswordPage')
const NewPasswordPage = lazyZone('NewPasswordPage')
const PanelPage = lazyZone('PanelPage')
const CoursesPage = lazyZone('CoursesPage')
const CoursePage = lazyZone('CoursePage')
const DayPage = lazyZone('DayPage')
const TaskPage = lazyZone('TaskPage')
const ActivatePage = lazyZone('ActivatePage')
const AccountPage = lazyZone('AccountPage')
const ProgramPage = lazyZone('ProgramPage')
const TrainerPage = lazyZone('TrainerPage')
const TrainerParticipantPage = lazyZone('TrainerParticipantPage')

/**
 * Mapa tras.
 *
 * DLACZEGO STRONY PUBLICZNE SĄ BEZ React.lazy — to nie przeoczenie.
 *
 * Podstrony były wcześniej ładowane leniwie. Wygląda to rozsądnie, ale zabija
 * prerendering: `renderToString` jest synchroniczne i nie potrafi poczekać, aż
 * doładuje się chunk. Zamiast treści strony do pliku HTML trafiał komunikat
 * „Ładowanie…" z Suspense — czyli robot wyszukiwarki dostawał pustą stronę,
 * mimo że prerendering formalnie „działał".
 *
 * Statyczne importy kosztują kilka kilobajtów w głównej paczce. Kompletna treść
 * w HTML dla każdej podstrony jest warta znacznie więcej, zwłaszcza że to na
 * stronach miejskich ma opierać się widoczność w wynikach lokalnych.
 *
 * Dodajesz trasę, która ma być indeksowana? Importuj ją statycznie tutaj
 * i dopisz do ROUTES w scripts/prerender.js.
 *
 * Dodajesz trasę w STREFIE kursów? Eksportuj ją z `@/kursy/index`, dopisz
 * `lazyZone(...)` wyżej — i jeżeli wchodzi na nowy pierwszy segment adresu,
 * dopisz go też do ZONE_PREFIXES w `@/kursy/paths` ORAZ do reguły w
 * `public/.htaccess` (sekcja 1a).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Czyste adresy sekcji. Na produkcji przechwytuje je .htaccess
          (przekierowanie 301 po stronie serwera), ale te trasy są potrzebne
          w trybie deweloperskim i na hostingach bez Apache. */}
      {SECTION_ALIASES.map((id) => (
        <Route key={id} path={`/${id}`} element={<Navigate to={`/#${id}`} replace />} />
      ))}

      {/* Strony miejskie — po jednej trasie na miasto, generowane z cities.json.
          Świadomie NIE używamy tu trasy z parametrem `/szkolenie-psow-:slug`:
          React Router v6 wymaga, by parametr zajmował cały segment ścieżki,
          a sklejony ze statycznym tekstem po prostu nie dopasowuje się i wpada
          w 404. Adres zostaje płaski i ze słowem kluczowym, bo tak jest lepiej
          dla wyszukiwarki niż `/szkolenie-psow/gliwice`. */}
      {citiesData.cities.map((city) => (
        <Route
          key={city.slug}
          path={`/szkolenie-psow-${city.slug}`}
          element={<CityPage slug={city.slug} />}
        />
      ))}

      <Route path="/polityka-prywatnosci" element={<PrivacyPolicyPage />} />
      <Route path="/regulamin" element={<TermsPage />} />

      {/* ---------- strefa kursów ----------
          Jedna granica Suspense dla całej strefy: wszystkie komponenty niżej
          czekają na ten sam import, więc wystarczy jeden ekran ładowania. */}
      <Route
        element={
          <Suspense fallback={<ZoneFallback />}>
            <ZoneProviders />
          </Suspense>
        }
      >
        {/* Publiczne — użytkownik nie jest jeszcze zalogowany. */}
        <Route path="/logowanie" element={<LoginPage />} />
        <Route path="/rejestracja" element={<RegisterPage />} />
        <Route path="/reset-hasla" element={<ResetPasswordPage />} />
        <Route path="/nowe-haslo" element={<NewPasswordPage />} />

        {/* Za logowaniem. ProtectedRoute to WYŁĄCZNIE wygoda UI —
            dane chronią polityki RLS w bazie. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<StrefaLayout />}>
            <Route path="/panel" element={<PanelPage />} />
            <Route path="/kursy" element={<CoursesPage />} />
            <Route path="/kursy/:slug" element={<CoursePage />} />
            <Route path="/kursy/:slug/dzien/:n" element={<DayPage />} />
            <Route path="/kursy/:slug/dzien/:n/zadanie/:taskId" element={<TaskPage />} />
            <Route path="/aktywuj" element={<ActivatePage />} />
            <Route path="/konto" element={<AccountPage />} />
            <Route path="/program/:slug" element={<ProgramPage />} />
            <Route path="/program/:slug/spotkanie/:n" element={<ProgramPage />} />
            <Route path="/trener" element={<TrainerPage />} />
            <Route path="/trener/kursant/:id" element={<TrainerParticipantPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export { citiesData }
