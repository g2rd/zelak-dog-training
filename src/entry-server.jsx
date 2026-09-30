import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from '@/app/App'

/**
 * Wejście dla prerenderingu (patrz scripts/prerender.js).
 * Renderuje aplikację do czystego HTML-a w trakcie builda — bez przeglądarki.
 */
export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )
}
