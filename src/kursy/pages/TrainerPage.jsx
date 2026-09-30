import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Check, Copy, KeyRound, MessageCircle, UserPlus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import {
  useAccessCodes,
  useAccountsWithoutAccess,
  useCreateAccessCode,
  useIsTrainer,
  useRevokeAccessCode,
  useTrainerOverview,
  useTrainerPrograms,
  useUpdateParticipant,
} from '@/kursy/hooks/useProgram'
import { useDogPhotoUrls } from '@/kursy/hooks/useProfile'
import { DogAvatar } from '@/kursy/components/DogAvatar'
import { DeleteUserButton } from '@/kursy/components/DeleteUserButton'
import { Field } from '@/kursy/components/Field'
import { Loading } from '@/kursy/components/Loading'
import { Notice } from '@/kursy/components/Notice'
import { formatDate } from '@/kursy/lib/currentDay'
import { dataErrorMessage } from '@/kursy/lib/errors'
import {
  INACTIVE_AFTER_DAYS,
  codeStatus,
  daysSince,
  formatCode,
  formatSince,
  isAccessOpen,
  sortForTrainer,
} from '@/kursy/lib/program'

/** Adres podawany razem z kodem. Stały, bo wiadomość trafia do ludzi, nie do localhost. */
const ACTIVATE_URL = 'zelak.pl/aktywuj'

/**
 * Panel trenera: kto czeka na zatwierdzenie, kto ćwiczy, a przede wszystkim —
 * kto przestał. Lista aktywnych kursantów sortuje się od najdawniejszej
 * aktywności, więc ten, z kim trzeba się skontaktować, jest na górze.
 *
 * Dostęp do danych pilnuje baza (`trainer_overview()` odmawia każdemu, kto
 * nie jest w tabeli `trainers`). Sprawdzenie `useIsTrainer` niżej służy tylko
 * temu, żeby zwykły kursant zobaczył zrozumiały komunikat zamiast błędu.
 */
export default function TrainerPage() {
  const { data: isTrainer, isLoading: roleLoading } = useIsTrainer()

  if (roleLoading) return <Loading />
  if (!isTrainer) return <NotTrainer />
  return <Overview />
}

export function NotTrainer() {
  return (
    <div className="container-content flex flex-col gap-6 py-10">
      <Seo title="Panel trenera | ZELAK" noindex />
      <h1 className="text-3xl">Panel trenera</h1>
      <Notice tone="warning" title="Brak dostępu">
        <p>Ta część strefy jest tylko dla trenera.</p>
      </Notice>
      <Button to="/panel" className="self-start">
        Wróć do panelu
      </Button>
    </div>
  )
}

function Overview() {
  const { data, isLoading, error } = useTrainerOverview()
  const rows = sortForTrainer(data ?? [])
  const { data: photos } = useDogPhotoUrls(rows.map((r) => r.dog_photo_path))
  const pending = rows.filter((r) => r.status === 'pending')
  // Wygasły dostęp trafia do archiwum, choć status wciąż brzmi „approved" —
  // termin liczy baza, status ustawia trener.
  const active = rows.filter((r) => r.status === 'approved' && isAccessOpen(r.expires_at))
  const archived = rows.filter((r) => r.status !== 'pending' && !active.includes(r))
  const photoOf = (row) => photos?.get(row.dog_photo_path)

  return (
    <>
      <Seo title="Panel trenera | ZELAK" noindex />

      <div className="container-content flex flex-col gap-10 py-10">
        <header className="flex flex-col gap-3">
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">Trener</span>
          <h1 className="text-3xl lg:text-4xl">Kursanci</h1>
        </header>

        {isLoading && <Loading className="min-h-[20vh]" />}
        {error && <Notice tone="error">{dataErrorMessage(error)}</Notice>}

        {!isLoading && !error && rows.length === 0 && (
          <Notice title="Nikt się jeszcze nie zgłosił">
            <p>
              Kursant zakłada konto, dodaje psa i zgłasza go do planu na stronie Kursy albo wpisuje
              kod od Ciebie na {ACTIVATE_URL}. Zgłoszenie pojawi się tutaj.
            </p>
          </Notice>
        )}

        {pending.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-sm uppercase tracking-wider text-muted">
              Czekają na dostęp ({pending.length})
            </h2>
            <ul className="flex flex-col gap-3">
              {pending.map((row) => (
                <PendingRow key={row.participant_id} row={row} photoUrl={photoOf(row)} />
              ))}
            </ul>
          </section>
        )}

        {active.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-sm uppercase tracking-wider text-muted">
              W trakcie ({active.length})
            </h2>
            <p className="text-sm text-muted">
              Najdłużej nieaktywni na górze. Kto nic nie odhaczył od {INACTIVE_AFTER_DAYS} dni,
              ma znacznik — to sygnał do kontaktu.
            </p>
            <ul className="flex flex-col gap-3">
              {active.map((row) => (
                <ActiveRow key={row.participant_id} row={row} photoUrl={photoOf(row)} />
              ))}
            </ul>
          </section>
        )}

        <AccountsSection />

        <CodesSection />

        {archived.length > 0 && (
          <details className="group flex flex-col gap-4 border-t border-line pt-8">
            <summary className="cursor-pointer py-3 font-heading text-sm uppercase tracking-wider text-muted">
              Wygasłe, zakończone i odrzucone ({archived.length})
            </summary>
            <p className="mt-4 text-sm text-muted">
              Postępy zostają do wglądu. Dostęp przedłużysz na stronie kursanta.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {archived.map((row) => (
                <ActiveRow key={row.participant_id} row={row} photoUrl={photoOf(row)} />
              ))}
            </ul>
          </details>
        )}
      </div>
    </>
  )
}

function Who({ row, photoUrl }) {
  return (
    <span className="flex items-center gap-3">
      <DogAvatar url={photoUrl} name={row.dog_name} />
      <span className="flex flex-col gap-1">
        <span className="text-[15px] font-medium text-primary">
          {row.dog_name}
          {row.dog_breed ? <span className="font-normal text-muted"> · {row.dog_breed}</span> : null}
        </span>
        <span className="text-sm text-secondary">
          {row.owner_name || 'bez imienia'} · {row.owner_email}
        </span>
      </span>
    </span>
  )
}

function PendingRow({ row, photoUrl }) {
  const update = useUpdateParticipant(row.participant_id)
  const now = new Date().toISOString()

  return (
    <li className="flex flex-col gap-4 rounded border border-primary bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <Who row={row} photoUrl={photoUrl} />
        <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
          {row.program_title} · zgłoszenie {formatDate(row.applied_at)}
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          size="md"
          disabled={update.isPending}
          onClick={() => update.mutate({ status: 'approved', approved_at: now })}
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          Nadaj dostęp
        </Button>
        <Button
          size="md"
          variant="outline"
          disabled={update.isPending}
          onClick={() => update.mutate({ status: 'rejected' })}
          aria-label={`Odrzuć zgłoszenie: ${row.dog_name}`}
        >
          <X aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Odrzuć</span>
        </Button>
      </div>
      {update.isError && <Notice tone="error">Nie udało się zapisać. Spróbuj ponownie.</Notice>}
    </li>
  )
}

function ActiveRow({ row, photoUrl }) {
  const open = isAccessOpen(row.expires_at)
  const idle = daysSince(row.last_activity)
  const stalled = row.status === 'approved' && open && (idle === null || idle >= INACTIVE_AFTER_DAYS)
  const state =
    row.status === 'rejected'
      ? 'odrzucony'
      : !open
        ? `dostęp wygasł ${formatDate(row.expires_at)}`
        : row.status === 'finished'
          ? 'zakończony'
          : null

  return (
    <li>
      <Link
        to={`/trener/kursant/${row.participant_id}`}
        className={cn(
          'group flex flex-col gap-3 rounded border bg-surface p-4 transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between',
          stalled ? 'border-secondary' : 'border-line',
        )}
      >
        <Who row={row} photoUrl={photoUrl} />

        <span className="flex flex-wrap items-center gap-x-5 gap-y-2 font-heading text-[11px] uppercase tracking-wider text-muted">
          <span>
            Spotkanie <span className="text-primary">{row.current_session}</span> / {row.sessions_total}
          </span>
          {row.status === 'approved' && open && (
            <span>
              Zadania <span className="text-primary">{row.homework_done}</span> / {row.homework_total}
            </span>
          )}
          <span className={cn('flex items-center gap-1.5', stalled && 'text-primary')}>
            {stalled && <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />}
            {formatSince(row.last_activity)}
          </span>
          {row.unread > 0 && (
            <span className="flex items-center gap-1.5 text-primary">
              <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />
              {row.unread} {row.unread === 1 ? 'nowa' : 'nowe'}
            </span>
          )}
          {open && row.expires_at && row.status === 'approved' && (
            <span>do {formatDate(row.expires_at)}</span>
          )}
          {state && <span>{state}</span>}
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 text-secondary transition-transform duration-300 group-hover:translate-x-1"
          />
        </span>
      </Link>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Konta bez dostępu
// ---------------------------------------------------------------------------

/**
 * Osoby, które założyły konto, ale nie zgłosiły jeszcze psa i nie wpisały
 * kodu. Jedno kliknięcie tworzy kod przypisany do ich adresu.
 */
function AccountsSection() {
  const { data: accounts, isLoading, error } = useAccountsWithoutAccess()
  const { data: programs } = useTrainerPrograms()

  if (isLoading || !accounts?.length) return null
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-heading text-sm uppercase tracking-wider text-muted">
        <UserPlus aria-hidden="true" className="h-4 w-4" />
        Konta bez dostępu ({accounts.length})
      </h2>
      <p className="max-w-[62ch] text-sm text-muted">
        Założyli konto, ale nie zgłosili psa. Utwórz kod i wyślij go — po wpisaniu na{' '}
        {ACTIVATE_URL} od razu zobaczą karty spotkań.
      </p>
      {error && <Notice tone="error">{dataErrorMessage(error)}</Notice>}
      <ul className="flex flex-col gap-3">
        {accounts.map((a) => (
          <AccountRow key={a.user_id} account={a} programId={programs?.[0]?.id} />
        ))}
      </ul>
    </section>
  )
}

function AccountRow({ account, programId }) {
  const create = useCreateAccessCode()
  const [created, setCreated] = useState(null)
  const dogs = account.dogs ?? []
  const existing = account.free_code ? { code: account.free_code, email: account.email } : null

  return (
    <li className="flex flex-col gap-3 rounded border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-[15px] font-medium text-primary">{account.full_name || 'bez imienia'}</span>
          <span className="break-all text-sm text-secondary">{account.email}</span>
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
            konto od {formatDate(account.created_at)}
            {!account.email_confirmed && ' · adres niepotwierdzony'}
            {' · '}
            {dogs.length ? dogs.map((d) => d.name).join(', ') : 'bez psa'}
          </span>
        </span>

        {!created &&
          (existing ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-[12px] tracking-wider text-primary">
                kod {formatCode(existing.code)}
              </span>
              <CopyButton text={codeMessage(existing)} label="Wiadomość" />
            </span>
          ) : (
            <Button
              size="md"
              disabled={create.isPending || !programId}
              onClick={() =>
                create.mutate({ programId, email: account.email }, { onSuccess: (row) => setCreated(row) })
              }
            >
              <KeyRound aria-hidden="true" className="h-4 w-4" />
              {create.isPending ? 'Tworzę…' : 'Utwórz kod'}
            </Button>
          ))}
      </div>

      {create.isError && <Notice tone="error">Nie udało się utworzyć kodu. Spróbuj ponownie.</Notice>}
      {created && <CreatedCode code={created} onClose={() => setCreated(null)} />}

      <div className="flex border-t border-line pt-2">
        <DeleteUserButton
          userId={account.user_id}
          label={`${account.full_name || 'bez imienia'} (${account.email})`}
        />
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Kody dostępu
// ---------------------------------------------------------------------------

/** Treść do wklejenia w SMS-a albo maila razem z kodem. */
function codeMessage(code) {
  const account = code.email ? `na adres ${code.email}` : ''
  return (
    `Twój kod dostępu do planu szkoleniowego: ${formatCode(code.code)}\n` +
    `Wejdź na ${ACTIVATE_URL}, zaloguj się albo załóż konto ${account}`.trimEnd() +
    ' i wpisz kod.'
  )
}

function CodesSection() {
  const { data: programs } = useTrainerPrograms()
  const { data: codes, isLoading, error } = useAccessCodes()
  const create = useCreateAccessCode()
  const [programId, setProgramId] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [created, setCreated] = useState(null)

  const chosen = programId || programs?.[0]?.id || ''
  const titles = new Map((programs ?? []).map((p) => [p.id, p.title]))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!chosen) return
    create.mutate(
      { programId: chosen, email: email.trim(), note: note.trim() },
      {
        onSuccess: (row) => {
          setCreated(row)
          setEmail('')
          setNote('')
        },
      },
    )
  }

  return (
    <section className="flex flex-col gap-5 border-t border-line pt-8">
      <h2 className="flex items-center gap-2 font-heading text-sm uppercase tracking-wider text-muted">
        <KeyRound aria-hidden="true" className="h-4 w-4" />
        Kody dostępu
      </h2>
      <p className="max-w-[62ch] text-[15px] text-secondary">
        Kod otwiera plan jednemu psu na {programs?.[0]?.access_months ?? 3} mies. i działa raz.
        Wpisz adres e-mail, a kod zadziała tylko na koncie z tym adresem. Bez adresu przypnie się
        do konta, które użyje go pierwsze.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex max-w-[60ch] flex-col gap-4 rounded border border-line bg-surface p-5 sm:p-6"
      >
        {programs?.length > 1 && (
          <Field as="select" label="Plan" value={chosen} onChange={(e) => setProgramId(e.target.value)}>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Field>
        )}
        <Field
          label="E-mail osoby (zalecany)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          placeholder="jan@przyklad.pl"
        />
        <Field
          label="Notatka dla siebie"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="np. barter — koszulki, gotówka 12.10"
        />
        {create.isError && (
          <Notice tone="error">
            {`${create.error?.message}`.includes('invalid_email')
              ? 'Ten adres e-mail wygląda na niepoprawny.'
              : 'Nie udało się utworzyć kodu. Spróbuj ponownie.'}
          </Notice>
        )}
        <Button type="submit" disabled={create.isPending || !chosen} className="self-start">
          {create.isPending ? 'Tworzę…' : 'Utwórz kod'}
        </Button>
      </form>

      {created && <CreatedCode code={created} onClose={() => setCreated(null)} />}

      {isLoading && <Loading className="min-h-[10vh]" />}
      {error && <Notice tone="error">{dataErrorMessage(error)}</Notice>}
      {codes?.length > 0 && (
        <details className="flex flex-col gap-3">
          <summary className="cursor-pointer py-3 font-heading text-[11px] uppercase tracking-wider text-muted">
            Wydane kody ({codes.length}, wolnych {codes.filter((c) => codeStatus(c) === 'free').length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {codes.map((c) => (
              <CodeRow key={c.id} code={c} programTitle={programs?.length > 1 ? titles.get(c.program_id) : null} />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function CopyButton({ text, label = 'Kopiuj' }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      size="md"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // Brak uprawnień do schowka (np. stara przeglądarka) — tekst jest
          // widoczny na ekranie, da się go zaznaczyć ręcznie.
        }
      }}
    >
      <Copy aria-hidden="true" className="h-4 w-4" />
      {copied ? 'Skopiowano' : label}
    </Button>
  )
}

function CreatedCode({ code, onClose }) {
  const message = codeMessage(code)
  return (
    <div className="flex max-w-[60ch] flex-col gap-4 rounded border border-primary bg-surface p-5 sm:p-6">
      <span className="font-heading text-[11px] uppercase tracking-wider text-muted">Nowy kod</span>
      <p className="font-heading text-3xl tracking-wider text-primary">{formatCode(code.code)}</p>
      <p className="whitespace-pre-line text-[15px] text-secondary">{message}</p>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={message} label="Kopiuj wiadomość" />
        <CopyButton text={formatCode(code.code)} label="Kopiuj sam kod" />
        <Button type="button" size="md" variant="ghost" onClick={onClose}>
          Zamknij
        </Button>
      </div>
    </div>
  )
}

function CodeRow({ code, programTitle }) {
  const revoke = useRevokeAccessCode()
  const status = codeStatus(code)

  return (
    <li className="flex flex-col gap-2 rounded border border-line bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex flex-col gap-1">
        <span
          className={cn(
            'font-heading text-[15px] tracking-wider',
            status === 'free' ? 'text-primary' : 'text-muted line-through decoration-1',
          )}
        >
          {formatCode(code.code)}
        </span>
        <span className="text-sm text-secondary">
          {[code.email || 'dowolny adres', code.note, programTitle].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-3 font-heading text-[11px] uppercase tracking-wider text-muted">
        <span>utworzony {formatDate(code.created_at)}</span>
        {status === 'used' &&
          (code.participant_id ? (
            <Link to={`/trener/kursant/${code.participant_id}`} className="text-primary hover:underline">
              użyty {formatDate(code.redeemed_at)}
            </Link>
          ) : (
            <span>użyty {formatDate(code.redeemed_at)}</span>
          ))}
        {status === 'revoked' && <span>unieważniony</span>}
        {status === 'free' && (
          <>
            <CopyButton text={codeMessage(code)} label="Wiadomość" />
            <Button
              type="button"
              size="md"
              variant="ghost"
              disabled={revoke.isPending}
              onClick={() => {
                if (window.confirm(`Unieważnić kod ${formatCode(code.code)}? Nie da się tego cofnąć.`)) {
                  revoke.mutate(code.id)
                }
              }}
            >
              Unieważnij
            </Button>
          </>
        )}
      </span>
    </li>
  )
}
