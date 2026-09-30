import { useEffect, useState } from 'react'
import { Share, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const DISMISS_KEY = 'zelak-install-hint'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari nie wspiera display-mode i wystawia własną flagę.
    window.navigator.standalone === true
  )
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Zachęta do dodania aplikacji na ekran główny.
 *
 * Dwie ścieżki, bo przeglądarki różnią się zasadniczo:
 *  - Chrome / Edge / Android dają zdarzenie `beforeinstallprompt`, które można
 *    przechwycić i wywołać własnym przyciskiem;
 *  - Safari na iOS takiego zdarzenia NIE MA i nigdy nie mieć nie będzie —
 *    instalacja jest wyłącznie ręczna, przez menu Udostępnij. Zostaje
 *    instrukcja słowna, bo nic innego nie jest tam możliwe.
 *
 * Nie pokazujemy nic, gdy aplikacja już działa zainstalowana albo gdy
 * użytkownik raz zamknął podpowiedź.
 */
export function InstallHint() {
  const [prompt, setPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return undefined

    if (isIos()) {
      setIos(true)
      setVisible(true)
      return undefined
    }

    const onPrompt = (event) => {
      // Bez tego Chrome pokaże własny pasek instalacji w swoim momencie.
      event.preventDefault()
      setPrompt(event)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* tryb prywatny — podpowiedź wróci przy następnej wizycie */
    }
  }

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice
    setPrompt(null)
    dismiss()
  }

  return (
    <aside className="relative flex flex-col gap-3 rounded border border-line bg-surface p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Zamknij podpowiedź o instalacji"
        className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded text-muted transition-colors hover:text-primary"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>

      <h2 className="pr-12 font-heading text-sm uppercase tracking-wider text-primary">
        Dodaj na ekran główny
      </h2>

      {ios ? (
        <p className="flex flex-wrap items-center gap-1.5 text-[15px] text-secondary">
          Stuknij ikonę
          <Share aria-hidden="true" className="inline h-4 w-4 text-primary" strokeWidth={1.8} />
          <span className="sr-only">Udostępnij</span>
          na dole ekranu, potem wybierz <strong className="text-primary">Do ekranu początkowego</strong>.
          Kurs otworzysz jednym dotknięciem, jak zwykłą aplikację.
        </p>
      ) : (
        <>
          <p className="text-[15px] text-secondary">
            Zainstaluj kurs jako aplikację — otworzysz go z ikony, bez szukania adresu
            w przeglądarce.
          </p>
          <Button onClick={install} className="self-start">
            Zainstaluj
          </Button>
        </>
      )}
    </aside>
  )
}
