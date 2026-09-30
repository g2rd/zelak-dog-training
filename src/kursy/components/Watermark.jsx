import { useEffect, useState } from 'react'

/**
 * Znak wodny z adresem kupującego, nakładany na odtwarzacz.
 *
 * CZEGO NIE ROBI, ŻEBY NIE BYŁO NIEPOROZUMIEŃ
 *
 * Nie blokuje nagrywania ekranu — tego nie da się zablokować, a osoba
 * z telefonem skierowanym w monitor obejdzie każde zabezpieczenie. Nie
 * utrudnia też oglądania: ma `pointer-events: none`, więc nie przechwytuje
 * kliknięć w odtwarzacz.
 *
 * CO ROBI
 *
 * Sprawia, że wyciek daje się przypisać konkretnemu kontu. Regulamin pozwala
 * zablokować dostęp bez zwrotu opłaty za udostępnianie materiałów — ale tylko
 * pod warunkiem, że wiadomo komu. Pozostałe zabezpieczenia (token na linku,
 * polityki RLS, blokada pobierania) utrudniają kradzież, a po fakcie nie mówią
 * o niej nic.
 *
 * Największą część odstraszania robi sama wiedza kursanta, że materiał jest
 * oznaczony. Dlatego obok odtwarzacza stoi zdanie, które o tym mówi wprost.
 *
 * OGRANICZENIE, KTÓREGO NIE DA SIĘ USUNĄĆ BEZ STRAT
 *
 * Film gra w ramce od Bunny. Gdy widz włączy pełny ekran przyciskiem
 * odtwarzacza, ramka przechodzi na pełny ekran i ten znak znika, bo żyje
 * w naszym dokumencie, nie w ramce. Domknięcie tego wymagałoby odebrania
 * ramce prawa do pełnego ekranu — a wtedy na iPhonie pełny ekran przestaje
 * działać zupełnie, bo Safari nie pozwala rozciągnąć na cały ekran niczego
 * poza samym elementem wideo. Kurs oglądany na spacerze, na telefonie, bez
 * pełnego ekranu to gorszy kompromis niż znak wodny nieobecny w pełnym ekranie.
 */

// Pięć pozycji, między którymi znak wędruje. Nieruchomy dałoby się przyciąć
// przy kadrowaniu nagrania albo trwale zasłonić oknem.
// Prawa krawędź nie przekracza 46%: przy wąskim telefonie dłuższy adres
// wyjechałby poza kadr i został przycięty, a przycięty adres nie identyfikuje
// nikogo — czyli znak wodny przestałby robić to jedno, do czego służy.
const POZYCJE = [
  { left: '5%', top: '10%' },
  { left: '46%', top: '16%' },
  { left: '44%', top: '72%' },
  { left: '6%', top: '78%' },
  { left: '24%', top: '44%' },
]

const CO_ILE_MS = 15000

export function Watermark({ email }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (!email) return undefined
    const t = window.setInterval(() => setI((v) => (v + 1) % POZYCJE.length), CO_ILE_MS)
    return () => window.clearInterval(t)
  }, [email])

  if (!email) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-10 select-none whitespace-nowrap font-mono leading-tight text-white"
      style={{
        ...POZYCJE[i],
        opacity: 0.24,
        fontSize: '11px',
        textShadow: '0 1px 2px rgba(0,0,0,.6)',
        transition: 'left 1.2s ease, top 1.2s ease',
      }}
    >
      {email}
    </div>
  )
}
