import { Link, useParams } from 'react-router-dom'
import { Check, Lock, Play } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { useCourse } from '@/kursy/hooks/useCourses'
import { useEnrollment } from '@/kursy/hooks/useEnrollment'
import { useCourseTasks } from '@/kursy/hooks/useTasks'
import { useProgress } from '@/kursy/hooks/useProgress'
import { Loading } from '@/kursy/components/Loading'
import { Notice } from '@/kursy/components/Notice'
import { ProgressBar } from '@/kursy/components/ProgressBar'
import { dayStats, formatDate, isDayDone, isDayUnlocked } from '@/kursy/lib/currentDay'
import { dataErrorMessage } from '@/kursy/lib/errors'

export default function CoursePage() {
  const { slug } = useParams()
  const { data: course, isLoading, error } = useCourse(slug)
  const duration = course?.duration_days ?? 60
  const enrollment = useEnrollment(course?.id, duration)
  const { data: tasks } = useCourseTasks(course?.id)
  const { doneIds } = useProgress()

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="container-content py-10">
        <Notice tone="error">{dataErrorMessage(error)}</Notice>
      </div>
    )
  }
  if (!course) {
    return (
      <div className="container-content flex flex-col gap-6 py-10">
        <h1 className="text-3xl">Nie znaleziono kursu</h1>
        <p className="text-[15px] text-secondary">
          Ten kurs nie istnieje albo nie jest jeszcze opublikowany.
        </p>
        <Button to="/kursy" className="self-start">
          Wróć do katalogu
        </Button>
      </div>
    )
  }

  const { hasAccess, expired, expiresAt } = enrollment
  const stats = dayStats(course.days, tasks ?? [], doneIds)
  const daysDone = course.days.filter((d) => isDayDone(stats.get(d.id))).length
  // Po otwarciu pełnego dostępu „dzień kalendarzowy" przestał cokolwiek znaczyć.
  // Sensowne jest prowadzenie tam, gdzie kursant faktycznie przerwał: do
  // pierwszej lekcji, której nie odhaczył w całości.
  const continueDay =
    course.days.find((d) => !isDayDone(stats.get(d.id))) ?? course.days[0]

  return (
    <>
      <Seo title={`${course.title} | ZELAK Dog Training`} noindex />

      <div className="container-content flex flex-col gap-10 py-10">
        <header className="flex flex-col gap-4">
          <nav aria-label="Ścieżka nawigacji">
            <ol className="flex flex-wrap items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted">
              <li>
                <Link to="/kursy" className="transition-colors hover:text-primary">
                  Kursy
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-secondary">{course.title}</li>
            </ol>
          </nav>

          <h1 className="text-3xl lg:text-4xl">{course.title}</h1>
          {course.description && (
            <p className="max-w-[62ch] text-[15px] text-secondary">{course.description}</p>
          )}
        </header>

        {/* ---------- stan dostępu ---------- */}
        {hasAccess && (
          <section className="flex flex-col gap-5 rounded border border-line bg-surface p-5 sm:p-6">
            <ProgressBar value={daysDone} max={duration} label="Dni zaliczone" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-heading text-[11px] uppercase tracking-wider text-muted">
                Masz dostęp do wszystkich lekcji
                {expiresAt ? ` · do ${formatDate(expiresAt)}` : ''}
              </p>
              {continueDay && (
                <Button to={`/kursy/${course.slug}/dzien/${continueDay.day_number}`} size="md">
                  <Play aria-hidden="true" className="h-4 w-4" />
                  {daysDone > 0 ? 'Kontynuuj' : 'Zacznij'} lekcję {continueDay.day_number}
                </Button>
              )}
            </div>
          </section>
        )}

        {expired && (
          <Notice tone="warning" title="Dostęp wygasł">
            <p>
              Dostęp skończył się {formatDate(expiresAt)}. Postęp jest zachowany — jeśli chcesz
              wrócić, napisz na kontakt@zelak.pl.
            </p>
          </Notice>
        )}

        {/* Na stronie nie ma sprzedaży. Dostęp do kursu online nadaje trener. */}
        {!hasAccess && !expired && (
          <Notice title="Dostęp nadaje trener">
            <p>
              Ten kurs nie jest sprzedawany na stronie. Jeśli chcesz z niego korzystać, napisz na
              kontakt@zelak.pl albo zapytaj na zajęciach.
            </p>
          </Notice>
        )}

        {/* ---------- siatka dni ---------- */}
        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-sm uppercase tracking-wider text-muted">
              Plan {duration} dni
            </h2>
            {!hasAccess && (
              <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
                Dzień 1 za darmo
              </span>
            )}
          </div>

          <ul className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
            {course.days.map((day) => {
              const unlocked = isDayUnlocked({ hasAccess, day })
              const stat = stats.get(day.id)
              const complete = isDayDone(stat)
              const biezaca = hasAccess && continueDay && day.id === continueDay.id

              const label = `Dzień ${day.day_number}: ${day.title}`

              // Kłódka oznacza dziś dokładnie jedno: brak dostępu do kursu.
              // Lekcje nie odblokowują się już po kolei, więc nie ma daty
              // otwarcia, którą można by pokazać.
              if (!unlocked) {
                return (
                  <li key={day.id}>
                    <span
                      aria-label={`${label} — dostępny po otrzymaniu dostępu`}
                      title="Dostępny po otrzymaniu dostępu"
                      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded border border-line bg-dark text-muted"
                    >
                      <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                      <span className="font-heading text-[11px]">{day.day_number}</span>
                    </span>
                  </li>
                )
              }

              return (
                <li key={day.id}>
                  <Link
                    to={`/kursy/${course.slug}/dzien/${day.day_number}`}
                    aria-label={`${label}${complete ? ' — zaliczony' : ''}${biezaca ? ' — tu skończyłeś' : ''}`}
                    aria-current={biezaca ? 'true' : undefined}
                    className={cn(
                      'flex aspect-square w-full flex-col items-center justify-center gap-1 rounded border transition-colors',
                      complete
                        ? 'border-primary bg-primary text-ink'
                        : biezaca
                          ? 'border-primary bg-surface text-primary'
                          : 'border-line bg-surface text-secondary hover:border-primary',
                    )}
                  >
                    {complete ? (
                      <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
                    ) : null}
                    <span className="font-heading text-[11px]">{day.day_number}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-heading text-[10px] uppercase tracking-wider text-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-primary" /> zaliczony
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-3 w-3 rounded-sm border border-primary" /> tu skończyłeś
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-3 w-3 rounded-sm border border-line" /> dostępny
            </li>
            <li className="flex items-center gap-2">
              <Lock aria-hidden="true" className="h-3 w-3" /> bez dostępu
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
