import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { useCourse } from '@/kursy/hooks/useCourses'
import { useEnrollment } from '@/kursy/hooks/useEnrollment'
import { useDayTasks } from '@/kursy/hooks/useTasks'
import { useProgress, useToggleTask } from '@/kursy/hooks/useProgress'
import { Loading } from '@/kursy/components/Loading'
import { Notice } from '@/kursy/components/Notice'
import { Markdown } from '@/kursy/components/Markdown'
import { ProgressBar } from '@/kursy/components/ProgressBar'
import { TaskItem } from '@/kursy/components/TaskItem'
import { isDayUnlocked } from '@/kursy/lib/currentDay'
import { dataErrorMessage } from '@/kursy/lib/errors'

export default function DayPage() {
  const { slug, n } = useParams()
  const dayNumber = Number(n)
  const { data: course, isLoading, error } = useCourse(slug)
  const duration = course?.duration_days ?? 60
  const { hasAccess } = useEnrollment(course?.id, duration)

  const day = course?.days.find((d) => d.day_number === dayNumber) ?? null
  const unlocked = day ? isDayUnlocked({ hasAccess, day }) : false

  const { data: tasks, isLoading: tasksLoading } = useDayTasks(unlocked ? day?.id : null)
  const { doneIds } = useProgress()
  const toggle = useToggleTask()

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="container-content py-10">
        <Notice tone="error">{dataErrorMessage(error)}</Notice>
      </div>
    )
  }

  if (!course || !day) {
    return (
      <div className="container-content flex flex-col gap-6 py-10">
        <h1 className="text-3xl">Nie znaleziono dnia</h1>
        <p className="text-[15px] text-secondary">Taki dzień nie istnieje w tym kursie.</p>
        <Button to={`/kursy/${slug}`} className="self-start">
          Wróć do kursu
        </Button>
      </div>
    )
  }

  const prev = dayNumber > 1 ? dayNumber - 1 : null
  const next = dayNumber < duration ? dayNumber + 1 : null
  const nextUnlocked =
    next !== null &&
    isDayUnlocked({
      hasAccess,
      day: course.days.find((d) => d.day_number === next) ?? { day_number: next },
    })

  const dayTasks = tasks ?? []
  const doneCount = dayTasks.filter((t) => doneIds.has(t.id)).length
  const allDone = dayTasks.length > 0 && doneCount === dayTasks.length

  return (
    <>
      <Seo title={`Dzień ${dayNumber} — ${course.title} | ZELAK`} noindex />

      <div className="container-content flex flex-col gap-8 py-10">
        <header className="flex flex-col gap-4">
          <nav aria-label="Ścieżka nawigacji">
            <ol className="flex flex-wrap items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted">
              <li>
                <Link to="/kursy" className="transition-colors hover:text-primary">
                  Kursy
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={`/kursy/${course.slug}`} className="transition-colors hover:text-primary">
                  {course.title}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-secondary">Dzień {dayNumber}</li>
            </ol>
          </nav>

          <div className="flex flex-col gap-2">
            <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
              Dzień {dayNumber} / {duration}
              {day.is_free_preview && !hasAccess ? ' · lekcja otwarta' : ''}
            </span>
            <h1 className="text-3xl lg:text-4xl">{day.title}</h1>
          </div>

          {hasAccess && <ProgressBar value={dayNumber} max={duration} label="Lekcja w kursie" />}
        </header>

        {/* Z dostępem otwarte są wszystkie lekcje, więc zamknięta lekcja
            oznacza tylko jedno: brak dostępu do kursu. */}
        {!unlocked ? (
          <Notice
            tone="warning"
            title="Ta lekcja wymaga dostępu"
            action={
              <Button to={`/kursy/${course.slug}`} size="md">
                Wróć do kursu
              </Button>
            }
          >
            <p>
              Dostęp do kursu nadaje trener — napisz na kontakt@zelak.pl. Z dostępem otwierają
              się od razu wszystkie lekcje.
            </p>
          </Notice>
        ) : (
          <>
            {day.intro_md && (
              <section className="rounded border border-line bg-surface p-5 sm:p-6">
                <Markdown>{day.intro_md}</Markdown>
              </section>
            )}

            <section className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-heading text-sm uppercase tracking-wider text-muted">
                  Zadania w tej lekcji
                </h2>
                {dayTasks.length > 0 && (
                  <span className="font-heading text-sm text-primary">
                    {doneCount} / {dayTasks.length}
                  </span>
                )}
              </div>

              {tasksLoading && <Loading className="min-h-[20vh]" />}

              {!tasksLoading && dayTasks.length === 0 && (
                <Notice title="Brak zadań w tej lekcji">
                  <p>Ta lekcja nie ma jeszcze ćwiczeń.</p>
                </Notice>
              )}

              <ul className="flex flex-col gap-3">
                {dayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    done={doneIds.has(task.id)}
                    disabled={toggle.isPending}
                    onToggle={(done) => toggle.mutate({ taskId: task.id, done })}
                  />
                ))}
              </ul>

              {toggle.isError && (
                <Notice tone="error">
                  Nie udało się zapisać postępu. Sprawdź połączenie i spróbuj ponownie.
                </Notice>
              )}

              {allDone && (
                <Notice tone="success" title="Lekcja zaliczona">
                  <p>
                    {next
                      ? 'Wszystkie zadania odhaczone. Następna lekcja czeka, ale pies zwykle potrzebuje kilku powtórzeń — wróć do niej jutro, jeśli to ma być trwałe.'
                      : 'Wszystkie zadania odhaczone. To ostatnia lekcja kursu — gratulacje!'}
                  </p>
                </Notice>
              )}
            </section>
          </>
        )}

        {/* ---------- nawigacja dni ---------- */}
        <nav
          aria-label="Nawigacja między dniami"
          className="flex items-center justify-between gap-3 border-t border-line pt-6"
        >
          {prev ? (
            <Link
              to={`/kursy/${course.slug}/dzien/${prev}`}
              className="inline-flex min-h-[44px] items-center gap-2 font-heading text-[12px] uppercase tracking-wider text-secondary transition-colors hover:text-primary"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              Dzień {prev}
            </Link>
          ) : (
            <span />
          )}

          {next ? (
            nextUnlocked ? (
              <Link
                to={`/kursy/${course.slug}/dzien/${next}`}
                className="inline-flex min-h-[44px] items-center gap-2 font-heading text-[12px] uppercase tracking-wider text-secondary transition-colors hover:text-primary"
              >
                Dzień {next}
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            ) : (
              <span
                className={cn(
                  'inline-flex min-h-[44px] items-center gap-2 font-heading text-[12px] uppercase tracking-wider text-muted',
                )}
              >
                <Lock aria-hidden="true" className="h-4 w-4" />
                Wymaga dostępu
              </span>
            )
          ) : (
            <span />
          )}
        </nav>
      </div>
    </>
  )
}
