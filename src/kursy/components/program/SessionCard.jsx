import { useState } from 'react'
import { FileDown, Lightbulb } from 'lucide-react'
import { Notice } from '@/kursy/components/Notice'
import { HomeworkGrid } from '@/kursy/components/program/HomeworkGrid'
import { OneShotList } from '@/kursy/components/program/OneShotList'
import { checklistHeadings, homeworkStats, splitItems } from '@/kursy/lib/program'
import { openSessionPdf } from '@/kursy/hooks/useProgram'

function SectionTitle({ children, aside }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="font-heading text-sm uppercase tracking-wider text-muted">{children}</h2>
      {aside && <span className="font-heading text-sm text-primary">{aside}</span>}
    </div>
  )
}

/**
 * Karta spotkania — odwzorowanie papierowej karty w tej samej kolejności:
 * plan zajęć i teoria, zadanie domowe, „przed spotkaniem sprawdź",
 * „zabierz na spotkanie", wskazówka.
 *
 * Ten sam komponent rysuje widok kursanta i trenera. `onToggle` = null
 * wyłącza odhaczanie (trener tylko patrzy, kurs zakończony jest do wglądu).
 */
export function SessionCard({ session, total, done, onToggle, toggleError }) {
  const { homework, check, gear } = splitItems(session.session_items)
  const headings = checklistHeadings(session.number, total)
  const stats = homeworkStats(homework, done)
  const [pdfError, setPdfError] = useState(false)

  const handlePdf = async () => {
    setPdfError(false)
    try {
      await openSessionPdf(session.pdf_path)
    } catch {
      setPdfError(true)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
          Spotkanie {session.number} z {total}
        </span>
        <h1 className="text-3xl lg:text-4xl">{session.title}</h1>
        {session.promise && <p className="max-w-[60ch] text-[15px] text-secondary">{session.promise}</p>}
      </header>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        {session.agenda?.length > 0 && (
          <section className="flex flex-col gap-3 rounded border border-line bg-surface p-5">
            <SectionTitle>Na zajęciach</SectionTitle>
            <ol className="flex flex-col gap-3">
              {session.agenda.map((point, i) => (
                <li key={i} className="flex gap-3 text-[15px] text-secondary">
                  <span className="font-heading text-primary">{i + 1}</span>
                  <span>{point}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {session.theory && (
          <section className="flex flex-col gap-3 rounded border border-line bg-surface p-5">
            <SectionTitle>Omawiamy</SectionTitle>
            <p className="text-[15px] text-secondary">{session.theory}</p>
          </section>
        )}
      </div>

      {homework.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle aside={`${stats.done} / ${stats.total}`}>Zadanie domowe</SectionTitle>
          <p className="text-sm text-muted">
            Kratki 1–7 to kolejne dni do następnego spotkania. Odhacz dzień, w którym zrobiłeś
            ćwiczenie.
          </p>
          <HomeworkGrid items={homework} done={done} onToggle={onToggle} />
        </section>
      )}

      {toggleError && (
        <Notice tone="error">Nie udało się zapisać odhaczenia. Sprawdź połączenie i spróbuj ponownie.</Notice>
      )}

      {(check.length > 0 || gear.length > 0) && (
        <div className="grid gap-8 md:grid-cols-2">
          {check.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionTitle>{headings.check}</SectionTitle>
              <OneShotList items={check} done={done} onToggle={onToggle} />
            </section>
          )}
          {gear.length > 0 && headings.gear && (
            <section className="flex flex-col gap-4">
              <SectionTitle>{headings.gear}</SectionTitle>
              <OneShotList items={gear} done={done} onToggle={onToggle} />
            </section>
          )}
        </div>
      )}

      {session.tip && (
        <aside className="flex gap-3 border-l-2 border-primary pl-4 text-[15px] text-secondary">
          <Lightbulb aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.6} />
          <p>
            <span className="font-medium text-primary">Wskazówka: </span>
            {session.tip}
          </p>
        </aside>
      )}

      {session.outro && (
        <Notice tone="success" title="Gratulacje">
          <p>{session.outro.replace(/^Gratulacje!\s*/, '')}</p>
        </Notice>
      )}

      {session.pdf_path && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handlePdf}
            className="inline-flex min-h-[44px] items-center gap-2 self-start font-heading text-[12px] uppercase tracking-wider text-secondary transition-colors hover:text-primary"
          >
            <FileDown aria-hidden="true" className="h-4 w-4" />
            Karta do druku (PDF)
          </button>
          {pdfError && <p className="text-sm text-muted">Karta w PDF nie jest jeszcze dostępna.</p>}
        </div>
      )}
    </div>
  )
}
