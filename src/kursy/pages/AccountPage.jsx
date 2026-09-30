import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { useMyEnrollments } from '@/kursy/hooks/useEnrollment'
import {
  useAddDog,
  useDeleteDog,
  useDogPhotoUrls,
  useDogs,
  useProfile,
  useSetDogPhoto,
  useUpdateProfile,
} from '@/kursy/hooks/useProfile'
import { useMyParticipations } from '@/kursy/hooks/useProgram'
import { DogAvatar } from '@/kursy/components/DogAvatar'
import { CheckboxField, Field } from '@/kursy/components/Field'
import { Notice } from '@/kursy/components/Notice'
import { Loading } from '@/kursy/components/Loading'
import { formatDate } from '@/kursy/lib/currentDay'
import { authErrorMessage } from '@/kursy/lib/errors'

const MIN_PASSWORD = 8

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: dogs } = useDogs()
  const { data: enrollments } = useMyEnrollments()
  const updateProfile = useUpdateProfile()
  const addDog = useAddDog()
  const deleteDog = useDeleteDog()
  const { data: participations } = useMyParticipations()
  const { data: photos } = useDogPhotoUrls(dogs?.map((d) => d.photo_path))
  const inProgram = new Set((participations ?? []).map((p) => p.dog_id))

  const [dog, setDog] = useState({ name: '', breed: '', birth_date: '' })
  const [password, setPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteMsg, setDeleteMsg] = useState(null)
  const [deleting, setDeleting] = useState(false)

  if (isLoading) return <Loading />

  const handleAddDog = async (event) => {
    event.preventDefault()
    if (!dog.name.trim()) return
    await addDog.mutateAsync({
      name: dog.name.trim(),
      breed: dog.breed.trim() || null,
      birth_date: dog.birth_date || null,
    })
    setDog({ name: '', breed: '', birth_date: '' })
  }

  // Usunięcie psa kasuje też jego kartę postępów (odhaczenia, notatki,
  // rozmowę z trenerem) — przy psie w programie trzeba o to zapytać.
  const handleDeleteDog = (d) => {
    if (
      inProgram.has(d.id) &&
      !window.confirm(
        `${d.name} jest zapisany do planu szkoleniowego. Usunięcie psa skasuje też jego odhaczenia, notatki i rozmowę z trenerem. Usunąć?`,
      )
    )
      return
    deleteDog.mutate(d)
  }

  const handlePassword = async (event) => {
    event.preventDefault()
    setPasswordMsg(null)
    if (password.length < MIN_PASSWORD) {
      setPasswordMsg({ tone: 'error', text: `Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.` })
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setPasswordMsg({ tone: 'error', text: authErrorMessage(error) })
      return
    }
    setPassword('')
    setPasswordMsg({ tone: 'success', text: 'Hasło zostało zmienione.' })
  }

  const handleDelete = async (event) => {
    event.preventDefault()
    setDeleteMsg(null)
    setDeleting(true)
    const { error } = await supabase.functions.invoke('delete-account', {
      body: { confirm: deleteConfirm },
    })
    setDeleting(false)
    if (error) {
      setDeleteMsg('Nie udało się usunąć konta. Napisz na kontakt@zelak.pl, zrobię to ręcznie.')
      return
    }
    await signOut()
    window.location.assign('/')
  }

  return (
    <>
      <Seo title="Konto | ZELAK Dog Training" noindex />

      <div className="container-content flex max-w-[70ch] flex-col gap-10 py-10">
        <header className="flex flex-col gap-3">
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
            Ustawienia
          </span>
          <h1 className="text-3xl lg:text-4xl">Konto</h1>
        </header>

        {/* ---------- dane ---------- */}
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Twoje dane</h2>
          <dl className="flex flex-col gap-3 rounded border border-line bg-surface p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-sm text-muted">E-mail</dt>
              <dd className="text-[15px] text-primary">{user?.email}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-sm text-muted">Imię</dt>
              <dd className="text-[15px] text-primary">{profile?.full_name || '—'}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-sm text-muted">Konto od</dt>
              <dd className="text-[15px] text-primary">
                {profile?.created_at ? formatDate(profile.created_at) : '—'}
              </dd>
            </div>
          </dl>

          <CheckboxField
            checked={profile?.marketing_consent ?? false}
            onChange={(e) =>
              updateProfile.mutate({
                marketing_consent: e.target.checked,
                marketing_consent_at: e.target.checked ? new Date().toISOString() : null,
              })
            }
            label="Chcę dostawać e-maile o nowych kursach i materiałach treningowych."
          />
        </section>

        {/* ---------- psy ---------- */}
        <section className="flex flex-col gap-4 border-t border-line pt-10">
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Moje psy</h2>

          {dogs?.length ? (
            <ul className="flex flex-col gap-3">
              {dogs.map((d) => (
                <DogRow
                  key={d.id}
                  dog={d}
                  photoUrl={photos?.get(d.photo_path)}
                  onDelete={() => handleDeleteDog(d)}
                />
              ))}
            </ul>
          ) : (
            <p className="text-[15px] text-secondary">Nie masz jeszcze dodanego psa.</p>
          )}

          {deleteDog.isError && <Notice tone="error">Nie udało się usunąć psa. Spróbuj ponownie.</Notice>}

          <form onSubmit={handleAddDog} className="flex flex-col gap-4 rounded border border-line bg-surface p-5">
            <Field
              label="Imię psa"
              required
              value={dog.name}
              onChange={(e) => setDog((d) => ({ ...d, name: e.target.value }))}
            />
            <Field
              label="Rasa"
              value={dog.breed}
              onChange={(e) => setDog((d) => ({ ...d, breed: e.target.value }))}
              placeholder="np. owczarek belgijski"
            />
            <Field
              label="Data urodzenia"
              type="date"
              value={dog.birth_date}
              onChange={(e) => setDog((d) => ({ ...d, birth_date: e.target.value }))}
            />
            <Button type="submit" disabled={addDog.isPending} className="self-start">
              {addDog.isPending ? 'Dodaję…' : 'Dodaj psa'}
            </Button>
          </form>
        </section>

        {/* ---------- kursy online ----------
            Tylko gdy ktoś ma dostęp. Dostęp nadaje trener wpisem w bazie —
            na stronie nie ma już sprzedaży ani faktur. */}
        {enrollments?.length > 0 && (
          <section className="flex flex-col gap-4 border-t border-line pt-10">
            <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Kursy online</h2>
            <ul className="flex flex-col gap-3">
              {enrollments.map((e) => (
                <li key={e.id} className="flex flex-col gap-1 rounded border border-line bg-surface p-4">
                  <span className="text-[15px] text-primary">{e.courses?.title}</span>
                  <span className="text-sm text-muted">
                    Od {formatDate(e.started_at)}
                    {e.expires_at ? ` do ${formatDate(e.expires_at)}` : ' · bezterminowo'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- hasło ---------- */}
        <section className="flex flex-col gap-4 border-t border-line pt-10">
          <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Zmiana hasła</h2>
          <form onSubmit={handlePassword} className="flex flex-col gap-4" noValidate>
            {passwordMsg && <Notice tone={passwordMsg.tone}>{passwordMsg.text}</Notice>}
            <Field
              label="Nowe hasło"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint={`Co najmniej ${MIN_PASSWORD} znaków.`}
            />
            <Button type="submit" variant="outline" className="self-start">
              Zapisz nowe hasło
            </Button>
          </form>
        </section>

        {/* ---------- wylogowanie i usunięcie konta ---------- */}
        <section className="flex flex-col gap-6 border-t border-line pt-10">
          <Button onClick={signOut} variant="outline" className="self-start">
            Wyloguj się
          </Button>

          <div className="flex flex-col gap-4 rounded border border-line bg-surface p-5">
            <h2 className="font-heading text-sm uppercase tracking-wider text-muted">
              Usunięcie konta
            </h2>
            <p className="text-[15px] text-secondary">
              Usuwamy konto, profil, dane i zdjęcia psów, postęp i dostęp do kursów. Operacji
              nie da się cofnąć, a otrzymany dostęp przepada. Szczegóły opisuje{' '}
              <Link to="/polityka-prywatnosci" className="underline hover:text-primary">
                polityka prywatności
              </Link>
              .
            </p>

            {deleteMsg && <Notice tone="error">{deleteMsg}</Notice>}

            <form onSubmit={handleDelete} className="flex flex-col gap-4">
              <Field
                label="Wpisz USUWAM, aby potwierdzić"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="USUWAM"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={deleteConfirm !== 'USUWAM' || deleting}
                className="self-start"
              >
                {deleting ? 'Usuwam…' : 'Usuń konto na stałe'}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </>
  )
}

/** Pies na liście: miniatura, dane, zmiana zdjęcia, usunięcie. */
function DogRow({ dog, photoUrl, onDelete }) {
  const setPhoto = useSetDogPhoto()
  const input = useRef(null)

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) setPhoto.mutate({ dog, file })
  }

  return (
    <li className="flex flex-col gap-3 rounded border border-line bg-surface p-4">
      <div className="flex items-center gap-4">
        <DogAvatar url={photoUrl} name={dog.name} size="md" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[15px] text-primary">{dog.name}</span>
          <span className="text-sm text-muted">
            {[dog.breed, dog.birth_date ? `ur. ${formatDate(dog.birth_date)}` : null]
              .filter(Boolean)
              .join(' · ') || 'brak dodatkowych danych'}
          </span>
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Usuń psa ${dog.name}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-line text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={handleFile} />
      <Button
        type="button"
        size="md"
        variant="ghost"
        className="self-start"
        disabled={setPhoto.isPending}
        onClick={() => input.current?.click()}
      >
        <Camera aria-hidden="true" className="h-4 w-4" />
        {setPhoto.isPending ? 'Wysyłam zdjęcie…' : dog.photo_path ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
      </Button>
      {setPhoto.isError && (
        <Notice tone="error">
          Nie udało się wysłać zdjęcia. Spróbuj innego pliku (JPG lub PNG) albo zrób zdjęcie jeszcze raz.
        </Notice>
      )}
    </li>
  )
}
