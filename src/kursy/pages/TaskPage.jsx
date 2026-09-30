import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { useCourse } from '@/kursy/hooks/useCourses'
import { useTask } from '@/kursy/hooks/useTasks'
import { useProgress, useToggleTask } from '@/kursy/hooks/useProgress'
import { Loading } from '@/kursy/components/Loading'
import { Notice } from '@/kursy/components/Notice'
import { Markdown } from '@/kursy/components/Markdown'
import { VideoPlayer } from '@/kursy/components/VideoPlayer'
import { dataErrorMessage } from '@/kursy/lib/errors'

/**
 * Pojedyncze zadanie na osobnym adresie.
 *
 * Na liście dnia zadanie rozwija się w miejscu — ten widok istnieje po to,
 * żeby dało się wysłać komuś link do konkretnego ćwiczenia i żeby film miał
 * pełną szerokość na telefonie.
 *
 * Zadania z dni zablokowanych nie przechodzą przez RLS, więc `task` jest wtedy
 * pusty — pokazujemy komunikat zamiast pustej strony.
 */
export default function TaskPage() {
  const { slug, n, taskId } = useParams()
  const dayNumber = Number(n)
  const { data: course } = useCourse(slug)
  const { data: task, isLoading, error } = useTask(taskId)
  const { doneIds } = useProgress()
  const toggle = useToggleTask()

  const backToDay = `/kursy/${slug}/dzien/${dayNumber}`

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="container-content py-10">
        <Notice tone="error">{dataErrorMessage(error)}</Notice>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="container-content flex flex-col gap-6 py-10">
        <h1 className="text-3xl">Zadanie niedostępne</h1>
        <p className="max-w-[58ch] text-[15px] text-secondary">
          To zadanie należy do dnia, który nie jest jeszcze odblokowany, albo do kursu, do którego
          nie masz dostępu.
        </p>
        <Button to={backToDay} className="self-start">
          Wróć do dnia {dayNumber}
        </Button>
      </div>
    )
  }

  const done = doneIds.has(task.id)

  return (
    <>
      <Seo title={`${task.title} | ZELAK Dog Training`} noindex />

      <div className="container-content flex max-w-[75ch] flex-col gap-8 py-10">
        <header className="flex flex-col gap-4">
          <Link
            to={backToDay}
            className="inline-flex min-h-[44px] items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Dzień {dayNumber}
            {course?.title ? ` · ${course.title}` : ''}
          </Link>

          <h1 className="text-3xl lg:text-4xl">{task.title}</h1>

          {task.duration_min ? (
            <span className="flex items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted">
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
              {task.duration_min} min
            </span>
          ) : null}
        </header>

        {task.bunny_video_id && <VideoPlayer taskId={task.id} title={`Film: ${task.title}`} />}

        {task.instructions_md && (
          <section className="rounded border border-line bg-surface p-5 sm:p-6">
            <Markdown>{task.instructions_md}</Markdown>
          </section>
        )}

        <div className="flex flex-col gap-4 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => toggle.mutate({ taskId: task.id, done: !done })}
            disabled={toggle.isPending}
            aria-pressed={done}
            className={cn(
              'flex min-h-[56px] w-full items-center justify-center gap-3 rounded border font-heading text-sm uppercase tracking-wider transition-colors',
              done
                ? 'border-primary bg-primary text-ink'
                : 'border-line bg-surface text-primary hover:border-primary',
              toggle.isPending && 'opacity-60',
            )}
          >
            <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
            {done ? 'Zadanie zaliczone' : 'Oznacz jako zrobione'}
          </button>

          {toggle.isError && (
            <Notice tone="error">Nie udało się zapisać. Sprawdź połączenie i spróbuj ponownie.</Notice>
          )}

          <Button to={backToDay} variant="outline" className="w-full">
            Wróć do listy zadań
          </Button>
        </div>
      </div>
    </>
  )
}
