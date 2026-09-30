import { useState } from 'react'
import { Check, ChevronDown, Clock, Video } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Markdown } from '@/kursy/components/Markdown'
import { VideoPlayer } from '@/kursy/components/VideoPlayer'

/**
 * Jedno zadanie na liście dnia: checkbox, tytuł, czas, ikona filmu.
 *
 * Checkbox jest osobnym elementem od przycisku rozwijania — inaczej każde
 * otwarcie instrukcji odhaczałoby zadanie. Oba mają co najmniej 44 × 44 px,
 * bo tyle wynosi minimalny cel dotykowy.
 *
 * Film ładuje się dopiero po rozwinięciu (`enabled={open}`).
 */
export function TaskItem({ task, done, onToggle, disabled = false }) {
  const [open, setOpen] = useState(false)
  const panelId = `task-panel-${task.id}`
  const hasDetails = Boolean(task.instructions_md || task.bunny_video_id)

  return (
    <li
      className={cn(
        'rounded border bg-surface transition-colors',
        done ? 'border-primary' : 'border-line',
      )}
    >
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`${done ? 'Odznacz' : 'Odhacz'} zadanie: ${task.title}`}
          disabled={disabled}
          onClick={() => onToggle(!done)}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded border transition-colors',
            done
              ? 'border-primary bg-primary text-ink'
              : 'border-line text-transparent hover:border-primary',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
        </button>

        <button
          type="button"
          onClick={() => hasDetails && setOpen((v) => !v)}
          aria-expanded={hasDetails ? open : undefined}
          aria-controls={hasDetails ? panelId : undefined}
          className={cn(
            'flex min-h-[44px] flex-1 items-start justify-between gap-3 text-left',
            !hasDetails && 'cursor-default',
          )}
        >
          <span className="flex flex-col gap-1.5 py-1">
            <span
              className={cn(
                'text-[15px] font-medium text-primary transition-colors',
                done && 'text-muted line-through',
              )}
            >
              {task.title}
            </span>

            <span className="flex flex-wrap items-center gap-4 font-heading text-[11px] uppercase tracking-wider text-muted">
              {task.duration_min ? (
                <span className="flex items-center gap-1.5">
                  <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                  {task.duration_min} min
                </span>
              ) : null}
              {task.bunny_video_id ? (
                <span className="flex items-center gap-1.5">
                  <Video aria-hidden="true" className="h-3.5 w-3.5" />
                  Film
                </span>
              ) : null}
            </span>
          </span>

          {hasDetails && (
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'mt-2 h-5 w-5 shrink-0 text-secondary transition-transform duration-300',
                open && 'rotate-180',
              )}
            />
          )}
          {hasDetails && (
            <span className="sr-only">
              {open ? 'Zwiń szczegóły' : 'Rozwiń szczegóły'} — {task.title}
            </span>
          )}
        </button>
      </div>

      {hasDetails && open && (
        <div id={panelId} className="flex flex-col gap-5 border-t border-line p-3 sm:p-4">
          {task.bunny_video_id && (
            <VideoPlayer taskId={task.id} enabled={open} title={`Film: ${task.title}`} />
          )}
          {task.instructions_md && <Markdown>{task.instructions_md}</Markdown>}
        </div>
      )}
    </li>
  )
}
