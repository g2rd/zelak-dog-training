import { Link } from 'react-router-dom'
import { ArrowRight, Lock, MapPin, Unlock } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { useCourses } from '@/kursy/hooks/useCourses'
import { useMyEnrollments } from '@/kursy/hooks/useEnrollment'
import { useMyParticipations, usePrograms } from '@/kursy/hooks/useProgram'
import { Loading } from '@/kursy/components/Loading'
import { Notice } from '@/kursy/components/Notice'
import { dataErrorMessage } from '@/kursy/lib/errors'
import { STATUS_LABELS } from '@/kursy/lib/program'

export default function CoursesPage() {
  const { data: courses, isLoading, error } = useCourses()
  const { data: enrollments } = useMyEnrollments()
  const { data: programs, isLoading: programsLoading } = usePrograms()
  const { data: participations } = useMyParticipations()

  const accessById = new Map(
    (enrollments ?? []).map((e) => [
      e.course_id,
      !e.expires_at || new Date(e.expires_at) > new Date(),
    ]),
  )

  return (
    <>
      <Seo title="Kursy | ZELAK Dog Training" noindex />

      <div className="container-content flex flex-col gap-8 py-10">
        <header className="flex flex-col gap-3">
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">Katalog</span>
          <h1 className="text-3xl lg:text-4xl">Kursy</h1>
        </header>

        {/* ---------- kursy stacjonarne ---------- */}
        <section className="flex flex-col gap-5">
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Kursy na żywo</h2>
          {programsLoading && <Loading className="min-h-[20vh]" />}
          <ul className="grid gap-5 sm:grid-cols-2">
            {(programs ?? []).map((program) => {
              const mine = (participations ?? []).filter((p) => p.program_id === program.id)
              const status = mine.find((p) => p.status === 'approved')?.status ?? mine[0]?.status
              return (
                <li key={program.id}>
                  <Link
                    to={`/program/${program.slug}`}
                    className="group flex h-full flex-col gap-4 rounded border border-line bg-surface p-5 transition-colors hover:border-primary sm:p-6"
                  >
                    <span className="flex items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted">
                      <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                      {status ? STATUS_LABELS[status] : 'Spotkania stacjonarne'}
                    </span>
                    <span className="font-heading text-xl uppercase tracking-heading text-primary">
                      {program.title}
                    </span>
                    {program.subtitle && <span className="text-sm text-muted">{program.subtitle}</span>}
                    {program.description && (
                      <span className="text-[15px] text-secondary">{program.description}</span>
                    )}
                    <span className="mt-auto flex items-center gap-2 pt-2 font-heading text-[12px] uppercase tracking-wider text-primary">
                      {status === 'approved' ? 'Moja karta' : status ? 'Zobacz' : 'Zgłoś się'}
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------- kursy online ----------
            Zdjęte z katalogu na czas programu stacjonarnego (`is_published =
            false`). Cała maszyneria zostaje: kto kurs kupił, nadal go tu
            widzi, a powrót to przestawienie jednej flagi w bazie. */}
        <h2 className="border-t border-line pt-8 font-heading text-sm uppercase tracking-wider text-muted">
          Kursy online
        </h2>

        {isLoading && <Loading className="min-h-[20vh]" />}
        {error && <Notice tone="error">{dataErrorMessage(error)}</Notice>}

        {!isLoading && !error && courses?.length === 0 && (
          <div className="flex flex-col gap-2 rounded border border-dashed border-line p-5 sm:p-6">
            <span className="font-heading text-[11px] uppercase tracking-wider text-muted">Wkrótce</span>
            <span className="font-heading text-xl uppercase tracking-heading text-secondary">
              Kursy online — w przygotowaniu
            </span>
            <span className="text-[15px] text-secondary">
              Codzienny plan pracy z psem: krótkie zadania z filmem i instrukcją, do przejścia we
              własnym tempie.
            </span>
          </div>
        )}

        <ul className="grid gap-5 sm:grid-cols-2">
          {(courses ?? []).map((course) => {
            const hasAccess = accessById.get(course.id) === true

            return (
              <li key={course.id}>
                <Link
                  to={`/kursy/${course.slug}`}
                  className="group flex h-full flex-col gap-4 rounded border border-line bg-surface p-5 transition-colors hover:border-primary sm:p-6"
                >
                  {course.cover_url && (
                    <img
                      src={course.cover_url}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full rounded object-cover"
                    />
                  )}

                  <span className="flex items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted">
                    {hasAccess ? (
                      <>
                        <Unlock aria-hidden="true" className="h-3.5 w-3.5" />
                        Masz dostęp
                      </>
                    ) : (
                      <>
                        <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                        {course.duration_days} dni
                      </>
                    )}
                  </span>

                  <span className="font-heading text-xl uppercase tracking-heading text-primary">
                    {course.title}
                  </span>

                  {course.description && (
                    <span className="text-[15px] text-secondary">{course.description}</span>
                  )}

                  <span className="mt-auto flex items-center gap-2 pt-2 font-heading text-[12px] uppercase tracking-wider text-primary">
                    {hasAccess ? 'Kontynuuj' : 'Zobacz kurs'}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
