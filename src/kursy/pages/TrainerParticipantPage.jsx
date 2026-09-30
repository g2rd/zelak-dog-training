import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/kursy/auth/AuthProvider'
import {
  useIsTrainer,
  useItemLog,
  useNotes,
  useProgram,
  useTrainerParticipant,
  useUpdateParticipant,
} from '@/kursy/hooks/useProgram'
import { useDogPhotoUrls } from '@/kursy/hooks/useProfile'
import { DogAvatar } from '@/kursy/components/DogAvatar'
import { DeleteUserButton } from '@/kursy/components/DeleteUserButton'
import { Loading } from '@/kursy/components/Loading'
import { Notice } from '@/kursy/components/Notice'
import { SessionCard } from '@/kursy/components/program/SessionCard'
import { SessionStrip } from '@/kursy/components/program/SessionStrip'
import { NotesField } from '@/kursy/components/program/NotesField'
import { MessageThread } from '@/kursy/components/program/MessageThread'
import { formatDate } from '@/kursy/lib/currentDay'
import { STATUS_LABELS, extendedExpiry, gateProgress, isAccessOpen } from '@/kursy/lib/program'
import { dataErrorMessage } from '@/kursy/lib/errors'
import { NotTrainer } from '@/kursy/pages/TrainerPage'

/**
 * Jeden kursant oczami trenera: ta sama karta co u kursanta, tylko do
 * odczytu, plus sterowanie przebiegiem kursu i odpowiedź w wątku.
 *
 * `?spotkanie=N` — którą kartę pokazać (domyślnie bieżącą).
 */
export default function TrainerParticipantPage() {
  const { data: isTrainer, isLoading: roleLoading } = useIsTrainer()
  if (roleLoading) return <Loading />
  if (!isTrainer) return <NotTrainer />
  return <ParticipantDetail />
}

function ParticipantDetail() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: participant, isLoading, error } = useTrainerParticipant(id)
  const { data: program, isLoading: programLoading } = useProgram(participant?.programs?.slug)
  const { done } = useItemLog(participant?.id)
  const { data: notes } = useNotes(participant?.id)
  const update = useUpdateParticipant(id)
  const { data: photos } = useDogPhotoUrls([participant?.dogs?.photo_path])

  if (isLoading || programLoading) return <Loading />
  if (error) {
    return (
      <div className="container-content py-10">
        <Notice tone="error">{dataErrorMessage(error)}</Notice>
      </div>
    )
  }
  if (!participant || !program) {
    return (
      <div className="container-content flex flex-col gap-6 py-10">
        <h1 className="text-3xl">Nie znaleziono kursanta</h1>
        <Button to="/trener" className="self-start">
          Wróć do listy
        </Button>
      </div>
    )
  }

  const sessions = program.sessions
  const total = sessions.length
  const current = Math.min(participant.current_session, total)
  const requested = Number(search.get('spotkanie'))
  const active = sessions.some((s) => s.number === requested) ? requested : current
  const session = sessions.find((s) => s.number === active)
  const sessionNumbers = new Map(sessions.map((s) => [s.id, s.number]))
  const dog = participant.dogs
  const owner = participant.profile
  const now = new Date().toISOString()

  return (
    <>
      <Seo title={`${dog?.name ?? 'Kursant'} | Panel trenera`} noindex />

      <div className="container-content flex flex-col gap-8 py-10">
        <nav aria-label="Ścieżka nawigacji">
          <Link
            to="/trener"
            className="inline-flex min-h-[44px] items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-primary"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            Kursanci
          </Link>
        </nav>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <DogAvatar url={photos?.get(dog?.photo_path)} name={dog?.name} size="lg" />
          <div className="flex flex-col gap-3">
            <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
              {participant.programs?.title} · {STATUS_LABELS[participant.status]}
            </span>
            <h1 className="text-3xl lg:text-4xl">
              {dog?.name}
              {dog?.breed && <span className="text-secondary"> · {dog.breed}</span>}
            </h1>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-secondary">
              <span>{owner?.full_name || 'bez imienia'}</span>
              {owner?.email && (
                <a href={`mailto:${owner.email}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                  <Mail aria-hidden="true" className="h-4 w-4" />
                  {owner.email}
                </a>
              )}
              {dog?.birth_date && <span>ur. {formatDate(dog.birth_date)}</span>}
            </p>
          </div>
        </header>

        {/* ---------- sterowanie przebiegiem ---------- */}
        <section className="flex flex-col gap-4 rounded border border-line bg-surface p-5">
          {participant.status === 'pending' && (
            <div className="flex flex-wrap gap-2">
              <Button disabled={update.isPending} onClick={() => update.mutate({ status: 'approved', approved_at: now })}>
                Nadaj dostęp
              </Button>
              <Button variant="outline" disabled={update.isPending} onClick={() => update.mutate({ status: 'rejected' })}>
                Odrzuć
              </Button>
            </div>
          )}

          {participant.status === 'approved' && (
            <>
              <p className="text-[15px] text-secondary">
                Bieżące spotkanie: <span className="text-primary">{current} z {total}</span>. Po
                zajęciach przestaw kursanta na następną kartę — jego siatka zadań domowych
                zaczyna się od nowa.
              </p>
              <div className="flex flex-wrap gap-2">
                {current < total ? (
                  <Button
                    disabled={update.isPending}
                    onClick={() => update.mutate({ current_session: current + 1 })}
                  >
                    Spotkanie {current + 1} odbyte
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    disabled={update.isPending}
                    onClick={() => update.mutate({ status: 'finished', finished_at: now })}
                  >
                    Zakończ kurs
                  </Button>
                )}
                {current > 1 && (
                  <Button
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ current_session: current - 1 })}
                  >
                    Cofnij do {current - 1}
                  </Button>
                )}
              </div>
            </>
          )}

          {(participant.status === 'finished' || participant.status === 'rejected') && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[15px] text-secondary">
                {participant.status === 'finished'
                  ? `Kurs zakończony${participant.finished_at ? ` ${formatDate(participant.finished_at)}` : ''}.`
                  : 'Zgłoszenie odrzucone.'}
              </p>
              <Button
                variant="outline"
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({ status: 'approved', finished_at: null, approved_at: participant.approved_at ?? now })
                }
              >
                Przywróć do kursu
              </Button>
            </div>
          )}

          {(participant.status === 'approved' || participant.status === 'finished') && (
            <>
              <AccessTerm participant={participant} update={update} />
              <GateControl participant={participant} program={program} done={done} update={update} />
            </>
          )}

          {update.isError && <Notice tone="error">Nie udało się zapisać zmiany. Spróbuj ponownie.</Notice>}
        </section>

        {participant.status !== 'pending' && session && (
          <>
            <SessionStrip
              sessions={sessions}
              current={current}
              active={active}
              linkTo={(k) => `/trener/kursant/${participant.id}?spotkanie=${k}`}
            />

            <SessionCard session={session} total={total} done={done} onToggle={null} />

            <section className="border-t border-line pt-8">
              <NotesField
                key={session.id}
                initial={notes?.get(session.id)?.body ?? ''}
                onSave={null}
                label={`Notatki kursanta — spotkanie ${session.number}`}
              />
            </section>
          </>
        )}

        <section className="flex flex-col gap-4 border-t border-line pt-8">
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Rozmowa</h2>
          <MessageThread
            participantId={participant.id}
            sessionId={session?.id}
            sessionNumbers={sessionNumbers}
            myId={user?.id}
            authorLabel={() => owner?.full_name || dog?.name || 'Kursant'}
            canWrite
            placeholder={`Napisz do opiekuna psa ${dog?.name ?? ''}…`}
          />
        </section>

        {/* Na końcu strony, z dala od codziennych przycisków. */}
        <section className="flex flex-col gap-3 border-t border-line pt-8">
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Konto kursanta</h2>
          <p className="text-sm text-muted">
            Usunięcie konta kasuje wszystko tej osoby, także inne psy i zgłoszenia.
          </p>
          <div className="flex">
            <DeleteUserButton
              userId={participant.user_id}
              label={`${owner?.full_name || 'bez imienia'}${owner?.email ? ` (${owner.email})` : ''}`}
              onDeleted={() => navigate('/trener', { replace: true })}
            />
          </div>
        </section>
      </div>
    </>
  )
}

/**
 * Termin dostępu kursanta. Po wygaśnięciu kursant nie widzi kart, ale trener
 * widzi wszystko jak wcześniej — stąd przedłużenie jest tutaj, obok postępów.
 */
function AccessTerm({ participant, update }) {
  const open = isAccessOpen(participant.expires_at)
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <p className="text-[15px] text-secondary">
        {!participant.expires_at
          ? 'Dostęp bez limitu czasu.'
          : open
            ? `Dostęp do ${formatDate(participant.expires_at)}.`
            : `Dostęp wygasł ${formatDate(participant.expires_at)} — kursant nie widzi już kart.`}
      </p>
      {participant.expires_at && (
        <Button
          size="md"
          variant="outline"
          disabled={update.isPending}
          onClick={() => update.mutate({ expires_at: extendedExpiry(participant.expires_at).toISOString() })}
        >
          Przedłuż o miesiąc
        </Button>
      )}
    </div>
  )
}

/**
 * Blokada spotkań po `free_sessions` (domyślnie 5). Trener widzi wszystkie
 * karty zawsze; tu widzi, ile kursant zaliczył, i może odblokować resztę
 * ręcznie — np. gdy przestawił go na spotkanie 6, a kratki nie są pełne.
 */
function GateControl({ participant, program, done, update }) {
  const limit = program.free_sessions
  if (!limit) return null
  const gate = gateProgress(program.sessions, done, limit)
  const open = gate.passed || participant.unlocked_all

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <p className="text-[15px] text-secondary">
        Spotkania od {limit + 1}:{' '}
        {gate.passed
          ? 'otwarte — kursant zaliczył 1–' + limit + '.'
          : participant.unlocked_all
            ? `odblokowane ręcznie (zaliczone ${gate.completed.length} z ${limit}).`
            : `zablokowane — zaliczone ${gate.completed.length} z ${limit}.`}
      </p>
      {!gate.passed && (
        <Button
          size="md"
          variant="outline"
          disabled={update.isPending}
          onClick={() => update.mutate({ unlocked_all: !participant.unlocked_all })}
        >
          {open ? 'Zablokuj z powrotem' : 'Odblokuj ręcznie'}
        </Button>
      )}
    </div>
  )
}
