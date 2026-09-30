import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/cn'

/**
 * Instrukcje zadań i wstępy dni są pisane w Markdownie (Supabase Table Editor).
 * Style listy/nagłówków są w globals.css pod klasą `.md`, bo Tailwind resetuje
 * marginesy i wypunktowania, a instrukcja bez wypunktowań jest nieczytelna.
 *
 * react-markdown domyślnie NIE renderuje surowego HTML-a — treść z bazy nie
 * może wstrzyknąć skryptu.
 */
export function Markdown({ children, className }) {
  if (!children) return null
  return (
    <div className={cn('md', className)}>
      <ReactMarkdown
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
