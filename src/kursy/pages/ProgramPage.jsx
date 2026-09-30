import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Dog, Lock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { useDogPhotoUrls, useDogs } from '@/kursy/hooks/useProfile'
import {
  useApplyToProgram,
  useItemLog,
  useMyParticipations,
  useNotes,
  useProgram,
  useProgramOutline,
  useRedeemCode,
  useSaveNote,
  useToggleItem,
} from '@/kursy/hooks/useProgram'
import { Field } from '@/kursy/components/Field'
import { Loading } from '@/kursy/components/Loading'
import { Notice } from '@/kursy/components/Notice'
import { SessionCard } from '@/kursy/components/program/SessionCard'
import { SessionStrip } from '@/kursy/components/program/SessionStrip'
import { NotesField } from '@/kursy/components/program/NotesField'
import { MessageThread } from '@/kursy/components/program/MessageThread'
import { CodeForm } from '@/kursy/components/program/CodeForm'
import { DogAvatar } from '@/kursy/components/DogAvatar'
import { formatDate } from '@/kursy/lib/currentDay'
import { applyErrorMessage, gateProgress, isAccessOpen } from '@/kursy/lib/program'
import { dataErrorMessage } from '@/kursy/lib/errors'

/**
 * Program stacjonarny z perspektywy kursanta.
 *
 * `/program/:slug`                 — bieżące spotkanie (albo zgłoszenie)
 * `/program/:slug/spotkanie/:n`    — konkretna karta
 * `?pies=<id>`                     — który pies, gdy w programie jest więcej niż jeden
 */
export default function ProgramPage() {
  const { slug, n } = useParams()
  const [search, setSearch] = useSearchParams()
  const { data: program, isLoading, error } = useProgram(slug)
  const { data: participations, isLoading: partLoading } = useMyParticipations()
  const { data: photos } = useDogPhotoUrls(participations?.map((p) => p.dogs?.photo_path))

  if (isLoading || partLoading) return <Loading />
  if (error) {
    return (
      <div className="container-content py-10">
        <Notice tone="error">{dataErrorMessage(error)}</Notice>
      </div>
    )
  }
  if (!program) {
    return (
      <div className="container-content flex flex-col gap-6 py-10">
        <h1 className="text-3xl">Nie znaleziono programu</h1>
        <Button to="/kursy" className="self-start">
          Wróć do katalogu
        </Button>
      </div>
    )
  }

  const mine = (participations ?? []).filter((p) => p.program_id === program.id)
  const selected = mine.find((p) => p.dog_id === search.get('pies')) ?? mine[0] ?? null
  const dogQuery = mine.length > 1 && selected ? `?pies=${selected.dog_id}` : ''
  const hasAccess = ['approved', 'finished'].includes(selected?.status)
  const expired = hasAccess && !isAccessOpen(selected.expires_at)

  return (
    <>
      <Seo title={`${program.title} | ZELAK`} noindex />

      <div className="container-content flex flex-col gap-8 py-10">
        <nav aria-label="Ścieżka nawigacji">
          <ol className="flex flex-wrap items-center gap-2 font-heading text-[11px] uppercase tracking-wider text-muted">
            <li>
              <Link to="/kursy" className="transition-colors hover:text-primary">
                Kursy
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-secondary">{program.title}</li>
          </ol>
        </nav>

        {mine.length > 1 && (
          <div role="tablist" aria-label="Pies" className="flex flex-wrap gap-2">
            {mine.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === selected?.id}
                onClick={() => setSearch({ pies: p.dog_id })}
                className={cn(
                  'flex min-h-[44px] items-center gap-2 rounded border px-4 text-[15px] transition-colors',
                  p.id === selected?.id ? 'border-primary text-primary' : 'border-line text-secondary',
                )}
              >
                {p.dogs?.photo_path ? (
                  <DogAvatar url={photos?.get(p.dogs.photo_path)} name={p.dogs?.name} className="h-7 w-7" />
                ) : (
                  <Dog aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
                )}
                {p.dogs?.name}
              </button>
            ))}
          </div>
        )}

        {!selected && <ApplySection program={program} participations={mine} />}

        {selected?.status === 'pending' && (
          <>
            <ProgramIntro program={program} />
            <Notice title={`Zgłoszenie psa ${selected.dogs?.name ?? ''} czeka na trenera`}>
              <p>
                Trener zobaczy zgłoszenie w swoim panelu i otworzy Ci dostęp do planu. Jeśli masz
                kod od trenera, wpisz go poniżej — wejdziesz od razu.
              </p>
            </Notice>
            <CodeForm dogId={selected.dog_id} />
          </>
        )}

        {selected?.status === 'rejected' && (
          <>
            <ProgramIntro program={program} />
            <Notice tone="warning" title="Zgłoszenie nie zostało przyjęte">
              <p>
                Jeśli to pomyłka, napisz na kontakt@zelak.pl albo zgłoś się ponownie — trafisz
                znowu na listę oczekujących.
              </p>
            </Notice>
            <ReapplyButton slug={program.slug} dogId={selected.dog_id} />
          </>
        )}

        {expired && (
          <>
            <ProgramIntro program={program} />
            <Notice tone="warning" title={`Dostęp wygasł ${formatDate(selected.expires_at)}`}>
              <p>
                Odhaczenia, notatki i rozmowa z trenerem zostają zapisane. Żeby wrócić do planu,
                wpisz nowy kod od trenera albo napisz na kontakt@zelak.pl.
              </p>
            </Notice>
            <CodeForm dogId={selected.dog_id} />
          </>
        )}

        {hasAccess && !expired && (
          <ParticipantView
            program={program}
            participant={selected}
            number={n ? Number(n) : null}
            dogQuery={dogQuery}
          />
        )}

        {selected && <OtherDogs program={program} participations={mine} />}
      </div>
    </>
  )
}

function ProgramIntro({ program }) {
  return (
    <header className="flex flex-col gap-3">
      {program.subtitle && (
        <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
          {program.subtitle}
        </span>
      )}
      <h1 className="text-3xl lg:text-4xl">{program.title}</h1>
      {program.description && (
        <p className="max-w-[60ch] text-[15px] text-secondary">{program.description}</p>
      )}
    </header>
  )
}

function ParticipantView({ program, participant, number, dogQuery }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  // `program.sessions` to tylko OTWARTE karty — zamkniętych baza nie wydaje.
  // Spis z kłódkami przychodzi osobno.
  const sessions = program.sessions
  const { data: outline } = useProgramOutline(program.id)
  const strip = outline ?? sessions.map((s) => ({ id: s.id, number: s.number, title: s.title, open: true }))
  const total = strip.length
  const current = Math.min(participant.current_session, total)
  const active = number && strip.some((s) => s.number === number) ? number : current
  const session = sessions.find((s) => s.number === active)
  const locked = !session && strip.some((s) => s.number === active && !s.open)

  const writable = participant.status === 'approved'
  const { done } = useItemLog(participant.id)
  const toggle = useToggleItem(participant.id)
  const { data: notes, isLoading: notesLoading } = useNotes(participant.id)
  const saveNote = useSaveNote(participant.id)
  const gate = gateProgress(sessions, done, program.free_sessions)
  const anyLocked = strip.some((s) => !s.open)

  // Ostatnia kratka spotkania 5 otwiera resztę. Baza wie o tym od razu, ale
  // karty i spis trzeba dociągnąć — inaczej kłódki zniknęłyby dopiero po
  // odświeżeniu strony.
  useEffect(() => {
    if (gate.passed && anyLocked) {
      queryClient.invalidateQueries({ queryKey: ['program', program.slug] })
      queryClient.invalidateQueries({ queryKey: ['program-outline', program.id] })
    }
  }, [gate.passed, anyLocked, queryClient, program.slug, program.id])

  const sessionNumbers = new Map(sessions.map((s) => [s.id, s.number]))

  if (locked) {
    return (
      <>
        <SessionStrip
          sessions={strip}
          current={current}
          active={active}
          linkTo={(k) => `/program/${program.slug}/spotkanie/${k}${dogQuery}`}
        />
        <LockedSession gate={gate} programSlug={program.slug} dogQuery={dogQuery} />
      </>
    )
  }

  if (!session) {
    return (
      <Notice tone="error" title="Brak kart w programie">
        <p>Program nie ma jeszcze wgranych spotkań. Daj znać trenerowi.</p>
      </Notice>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
          {program.title} · {participant.dogs?.name}
          {participant.status === 'finished' ? ' · kurs zakończony' : ''}
          {participant.expires_at ? ` · dostęp do ${formatDate(participant.expires_at)}` : ''}
        </span>
        <SessionStrip
          sessions={strip}
          current={current}
          active={active}
          linkTo={(k) => `/program/${program.slug}/spotkanie/${k}${dogQuery}`}
        />
        {anyLocked && gate.limit && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            Spotkania od {gate.limit + 1} otworzą się po zaliczeniu 1–{gate.limit}: zaliczone{' '}
            {gate.completed.length} z {gate.limit}.
          </p>
        )}
      </div>

      {participant.status === 'finished' && (
        <Notice title="Kurs zakończony">
          <p>Karty, odhaczenia i notatki zostają tu do wglądu. Zmieniać ich już nie można.</p>
        </Notice>
      )}

      {active > current && (
        <Notice>
          <p>
            To karta spotkania, które jeszcze przed Wami. Możesz ją przeczytać, ale zadanie
            domowe zaczyna się po zajęciach.
          </p>
        </Notice>
      )}

      <SessionCard
        session={session}
        total={total}
        done={done}
        onToggle={writable ? (vars) => toggle.mutate(vars) : null}
        toggleError={toggle.isError}
      />

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        {notesLoading ? (
          <Loading className="min-h-[10vh]" />
        ) : (
          <NotesField
            key={session.id}
            initial={notes?.get(session.id)?.body ?? ''}
            onSave={writable ? (body) => saveNote.mutate({ sessionId: session.id, body }) : null}
            saving={saveNote.isPending}
            error={saveNote.isError}
            label={`Moje notatki — spotkanie ${session.number}`}
          />
        )}
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-8">
        <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Rozmowa z trenerem</h2>
        <p className="text-sm text-muted">
          Coś nie wychodzi? Napisz, zanim minie tydzień do kolejnego spotkania. Trener widzi
          też Twoje odhaczenia i notatki.
        </p>
        <MessageThread
          participantId={participant.id}
          sessionId={session.id}
          sessionNumbers={sessionNumbers}
          myId={user?.id}
          authorLabel={() => 'Trener'}
          canWrite={writable}
          placeholder="Napisz do trenera…"
        />
      </section>
    </>
  )
}

/**
 * Karta z kłódką: czego brakuje, żeby ją otworzyć. „Zaliczone” = wszystkie
 * kratki zadań domowych i cała lista „przed spotkaniem sprawdź”.
 */
function LockedSession({ gate, programSlug, dogQuery }) {
  const missing = Array.from({ length: gate.limit ?? 0 }, (_, i) => i + 1).filter(
    (n) => !gate.completed.includes(n),
  )
  return (
    <Notice title="To spotkanie jest jeszcze zablokowane">
      <p>
        Dalsze karty otwierają się, gdy zaliczysz spotkania 1–{gate.limit}: odhaczysz wszystkie
        dni zadań domowych i całą listę „przed spotkaniem sprawdź”.
      </p>
      {missing.length > 0 && (
        <p>
          Do zaliczenia:{' '}
          {missing.map((n, i) => (
            <span key={n}>
              {i > 0 && ', '}
              <Link
                to={`/program/${programSlug}/spotkanie/${n}${dogQuery}`}
                className="underline hover:text-primary"
              >
                spotkanie {n}
              </Link>
            </span>
          ))}
          .
        </p>
      )}
    </Notice>
  )
}

/**
 * Zgłoszenie psa: z kodem od trenera dostęp otwiera się od razu, bez kodu
 * zgłoszenie czeka w panelu trenera.
 */
function ApplySection({ program, participations }) {
  const navigate = useNavigate()
  const { data: dogs, isLoading } = useDogs()
  const apply = useApplyToProgram()
  const redeem = useRedeemCode()
  const taken = new Set(participations.map((p) => p.dog_id))
  const free = (dogs ?? []).filter((d) => !taken.has(d.id))
  const [dogId, setDogId] = useState('')
  const [code, setCode] = useState('')

  const chosen = dogId || free[0]?.id || ''
  const pending = apply.isPending || redeem.isPending
  const failed = apply.isError ? apply.error : redeem.isError ? redeem.error : null

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!chosen) return
    if (!code.trim()) {
      apply.mutate({ slug: program.slug, dogId: chosen })
      return
    }
    // Kod może prowadzić do innego programu niż ten, na którego stronie jesteśmy.
    redeem.mutate(
      { code: code.trim(), dogId: chosen },
      {
        onSuccess: (data) => {
          if (data?.program_slug && data.program_slug !== program.slug) {
            navigate(`/program/${data.program_slug}?pies=${data.dog_id}`)
          }
        },
      },
    )
  }

  return (
    <>
      <ProgramIntro program={program} />

      {isLoading ? (
        <Loading className="min-h-[20vh]" />
      ) : free.length === 0 ? (
        <Notice
          title="Najpierw dodaj psa"
          action={
            <Button to="/konto" size="md">
              Dodaj psa
            </Button>
          }
        >
          <p>Zgłaszasz konkretnego psa — trener musi wiedzieć, z kim pracujecie.</p>
        </Notice>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex max-w-[60ch] flex-col gap-5 rounded border border-line bg-surface p-5 sm:p-6"
        >
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Zgłoś psa</h2>

          {free.length > 1 ? (
            <Field
              as="select"
              label="Pies"
              value={chosen}
              onChange={(e) => setDogId(e.target.value)}
            >
              {free.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.breed ? ` (${d.breed})` : ''}
                </option>
              ))}
            </Field>
          ) : (
            <p className="text-[15px] text-secondary">
              Zgłaszasz psa: <span className="text-primary">{free[0].name}</span>
            </p>
          )}

          <Field
            label="Kod od trenera"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="ABCD-EFGH"
            hint="Nie masz kodu? Zostaw puste — trener zobaczy zgłoszenie i otworzy Ci dostęp."
          />

          {failed && <Notice tone="error">{applyErrorMessage(failed)}</Notice>}

          <Button type="submit" disabled={pending} className="self-start">
            {pending ? 'Wysyłam…' : code.trim() ? 'Wejdź z kodem' : 'Zgłoś psa'}
          </Button>
        </form>
      )}
    </>
  )
}

function ReapplyButton({ slug, dogId }) {
  const apply = useApplyToProgram()
  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        disabled={apply.isPending}
        onClick={() => apply.mutate({ slug, dogId })}
        className="self-start"
      >
        Zgłoś się ponownie
      </Button>
      {apply.isError && <Notice tone="error">{applyErrorMessage(apply.error)}</Notice>}
    </div>
  )
}

/** Zgłoszenie kolejnego psa, gdy jeden już jest w programie. */
function OtherDogs({ program, participations }) {
  const { data: dogs } = useDogs()
  const [open, setOpen] = useState(false)
  const taken = new Set(participations.map((p) => p.dog_id))
  const free = (dogs ?? []).filter((d) => !taken.has(d.id))
  if (free.length === 0) return null

  return (
    <div className="border-t border-line pt-8">
      {open ? (
        <ApplySection program={program} participations={participations} />
      ) : (
        <Button variant="ghost" onClick={() => setOpen(true)}>
          Zgłoś kolejnego psa
        </Button>
      )}
    </div>
  )
}
