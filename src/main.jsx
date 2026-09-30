import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/app/App'
// Czcionki hostowane lokalnie zamiast z Google Fonts.
// Powód wydajnościowy: arkusz z fonts.googleapis.com blokował renderowanie
// (osobny DNS + TLS + 780 ms na sam CSS, potem dopiero pliki .woff2).
// Powód formalny: znika przekazywanie adresów IP odwiedzających do Google.
// Pakiety @fontsource deklarują font-display: swap, więc tekst pojawia się
// natychmiast w czcionce zastępczej i podmienia po wczytaniu.
// Tylko podzbiory łacińskie: `latin` to znaki podstawowe, `latin-ext` dodaje
// polskie ą ć ę ł ń ó ś ź ż. Import pełnych plików ciągnąłby też cyrylicę,
// grekę i wietnamski — 23 pliki zamiast 8 w katalogu wynikowym.
import '@fontsource/oswald/latin-400.css'
import '@fontsource/oswald/latin-ext-400.css'
import '@fontsource/oswald/latin-600.css'
import '@fontsource/oswald/latin-ext-600.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-ext-600.css'
import '@/styles/globals.css'

const container = document.getElementById('root')

const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Po prerenderingu (npm run build) #root zawiera już gotowy HTML —
// wtedy tylko go "ożywiamy". W trybie deweloperskim jest pusty.
if (container.hasChildNodes()) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
