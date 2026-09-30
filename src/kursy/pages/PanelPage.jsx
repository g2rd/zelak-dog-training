import { Link } from 'react-router-dom'
import { ArrowRight, Dog, Plus } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { useMyEnrollments } from '@/kursy/hooks/useEnrollment'
import { useDogs, useProfile } from '@/kursy/hooks/useProfile'
import { useMyParticipations } from '@/kursy/hooks/useProgram'
import { Loading } from '@/kursy/components/Loading'
import { Notice } from '@/kursy/components/Notice'
import { InstallHint } from '@/kursy/components/InstallHint'
import { currentDay, formatDate } from '@/kursy/lib/currentDay'
import { dataErrorMessage } from '@/kursy/lib/errors'
import { STATUS_LABELS } from '@/kursy/lib/program'

export default function PanelPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: enrollments, isLoading, error } = useMyEnrollments()
  const { data: dogs } = useDogs()
  const { data: participations, isLoading: partLoading } = useMyParticipations()
  const nothing = !enrollments?.length && !participations?.length

  const name = profile?.full_name || user?.email?.split('@')[0] || ''

  return (
    <>
      <Seo title="Panel | ZELAK Dog Training" noindex />

      <div className="container-content flex flex-col gap-10 py-10">
        <header className="flex flex-col gap-3">
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
            Strefa kursów
          </span>
          <h1 className="text-3xl lg:text-4xl">{name ? `Cześć, ${name}` : 'Cześć'}</h1>
          <p className="max-w-[58ch] text-[15px] text-secondary">
            Tu znajdziesz swoje kursy i codzienną listę zadań. Trening działa wtedy, gdy jest
            regularny — nawet dziesięć minut dziennie robi różnicę.
          </p>
        </header>

        <InstallHint />

        <section className="flex flex-col gap-5">
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Moje kursy</h2>

          {(isLoading || partLoading) && <Loading className="min-h-[20vh]" />}
          {error && <Notice tone="error">{dataErrorMessage(error)}</Notice>}

          {!isLoading && !partLoading && !error && nothing && (
            <Notice
              title="Nie masz jeszcze żadnego kursu"
              action={
                <Button to="/kursy" size="md">
                  Zobacz kursy
                </Button>
              }
            >
              <p>
                Chodzisz na zajęcia na żywo? Zgłoś psa do programu w katalogu — tam odhaczysz
                zadania domowe i napiszesz do trenera.
              </p>
            </Notice>
          )}

          {!isLoading && !partLoading && (
            <Link
              to="/aktywuj"
              className="inline-flex min-h-[44px] items-center self-start text-[15px] text-secondary underline underline-offset-4 transition-colors hover:text-primary"
            >
              Masz kod od trenera? Aktywuj go tutaj
            </Link>
          )}

          {participations?.length > 0 && (
            <ul className="flex flex-col gap-4">
              {participations.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/program/${p.programs?.slug}${participations.length > 1 ? `?pies=${p.dog_id}` : ''}`}
                    className="group flex items-start justify-between gap-4 rounded border border-line bg-surface p-5 transition-colors hover:border-primary sm:p-6"
                  >
                    <span className="flex flex-col gap-2">
                      <span className="font-heading text-xl uppercase tracking-heading text-primary">
                        {p.programs?.title} · {p.dogs?.name}
                      </span>
                      <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
                        {p.status === 'approved' ? `Spotkanie ${p.current_session}` : STATUS_LABELS[p.status]}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-1 h-5 w-5 shrink-0 text-secondary transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <ul className="flex flex-col gap-4">
            {(enrollments ?? []).map((enrollment) => {
              const course = enrollment.courses
              if (!course) return null
              const expired = enrollment.expires_at && new Date(enrollment.expires_at) <= new Date()
              const day = currentDay(enrollment.started_at, course.duration_days)

              return (
                <li key={enrollment.id}>
                  <Link
                    to={`/kursy/${course.slug}`}
                    className="group flex flex-col gap-4 rounded border border-line bg-surface p-5 transition-colors hover:border-primary sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="font-heading text-xl uppercase tracking-heading text-primary">
                          {course.title}
                        </span>
                        <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
                          {expired
                            ? `Dostęp wygasł ${formatDate(enrollment.expires_at)}`
                            : `Dzień ${day} z ${course.duration_days}`}
                        </span>
                      </div>
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1 h-5 w-5 shrink-0 text-secondary transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </div>

                    <span className="font-heading text-[12px] uppercase tracking-wider text-primary">
                      {expired ? 'Zobacz postęp' : 'Kontynuuj'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {enrollments?.length > 0 && (
            <Button to="/kursy" variant="ghost">
              Zobacz wszystkie kursy
            </Button>
          )}
        </section>

        <section className="flex flex-col gap-5 border-t border-line pt-10">
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Mój pies</h2>

          {dogs?.length ? (
            <ul className="flex flex-wrap gap-3">
              {dogs.map((dog) => (
                <li
                  key={dog.id}
                  className="flex items-center gap-3 rounded border border-line bg-surface px-4 py-3"
                >
                  <Dog aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.6} />
                  <span className="flex flex-col">
                    <span className="text-[15px] text-primary">{dog.name}</span>
                    {dog.breed && <span className="text-sm text-muted">{dog.breed}</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-secondary">
              Dodaj psa w ustawieniach konta — plan treningowy łatwiej prowadzić, gdy wiadomo, z kim
              pracujesz.
            </p>
          )}

          <Button to="/konto" variant="outline" className="self-start">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Zarządzaj psami
          </Button>
        </section>
      </div>
    </>
  )
}
