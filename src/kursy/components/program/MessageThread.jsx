import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/kursy/components/Notice'
import { useMarkThreadRead, useMessages, useSendMessage } from '@/kursy/hooks/useProgram'

const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Wątek kursant ↔ trener. Jeden na zgłoszenie, a każda wiadomość pamięta,
 * przy którym spotkaniu powstała — trener widzi kontekst bez dopytywania.
 *
 * Między spotkaniami mija tydzień. To jedyny kanał, w którym trener widzi,
 * że coś nie idzie, zanim minie kolejne siedem dni.
 *
 * @param {string} myId            id zalogowanego — jego wiadomości po prawej
 * @param {(m) => string} authorLabel  podpis cudzej wiadomości
 * @param {boolean} canWrite       false = kurs zakończony
 */
export function MessageThread({ participantId, sessionId, sessionNumbers, myId, authorLabel, canWrite, placeholder }) {
  const { data: messages, isLoading } = useMessages(participantId)
  const send = useSendMessage(participantId)
  const markRead = useMarkThreadRead(participantId)
  const [body, setBody] = useState('')
  const endRef = useRef(null)

  const unreadFromOther = (messages ?? []).some((m) => m.author_id !== myId && !m.read_at)

  // Otwarcie wątku = przeczytanie wiadomości drugiej strony.
  useEffect(() => {
    if (unreadFromOther && !markRead.isPending) markRead.mutate()
  }, [unreadFromOther]) // celowo bez `markRead`: nowy obiekt przy każdym renderze

  const handleSubmit = async (event) => {
    event.preventDefault()
    const text = body.trim()
    if (!text) return
    await send.mutateAsync({ body: text, sessionId })
    setBody('')
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div className="flex flex-col gap-4">
      {!isLoading && (messages ?? []).length === 0 && (
        <p className="text-[15px] text-secondary">Jeszcze nic tu nie ma.</p>
      )}

      <ol className="flex flex-col gap-3">
        {(messages ?? []).map((m) => {
          const mine = m.author_id === myId
          const n = sessionNumbers.get(m.session_id)
          return (
            <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'flex max-w-[85%] flex-col gap-1 rounded border p-3',
                  mine ? 'border-line bg-surface' : 'border-primary bg-surface',
                )}
              >
                <span className="font-heading text-[10px] uppercase tracking-wider text-muted">
                  {mine ? 'Ty' : authorLabel(m)} · {timeFormatter.format(new Date(m.created_at))}
                  {n ? ` · spotkanie ${n}` : ''}
                </span>
                <p className="whitespace-pre-wrap text-[15px] text-primary">{m.body}</p>
              </div>
            </li>
          )
        })}
      </ol>
      <div ref={endRef} />

      {canWrite && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor={`msg-${participantId}`} className="sr-only">
            Nowa wiadomość
          </label>
          <textarea
            id={`msg-${participantId}`}
            value={body}
            maxLength={4000}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            className="min-h-[96px] w-full rounded border border-line bg-surface px-4 py-3 text-base text-primary placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none"
          />
          <Button type="submit" disabled={send.isPending || !body.trim()} className="self-end">
            <Send aria-hidden="true" className="h-4 w-4" />
            {send.isPending ? 'Wysyłam…' : 'Wyślij'}
          </Button>
          {send.isError && (
            <Notice tone="error">Nie udało się wysłać wiadomości. Spróbuj ponownie.</Notice>
          )}
        </form>
      )}
    </div>
  )
}
