import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { useAddDog, useDogs } from '@/kursy/hooks/useProfile'
import { CodeForm } from '@/kursy/components/program/CodeForm'
import { Field } from '@/kursy/components/Field'
import { Loading } from '@/kursy/components/Loading'
import { Notice } from '@/kursy/components/Notice'

/**
 * `/aktywuj` — krótki adres do podania razem z kodem („wejdź na
 * zelak.pl/aktywuj i wpisz kod"). Niezalogowanego ProtectedRoute odsyła na
 * logowanie i po zalogowaniu wraca tutaj.
 *
 * Kod trzeba przypisać do psa, więc kto psa jeszcze nie dodał, dodaje go
 * tu, bez chodzenia do ustawień konta.
 */
export default function ActivatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: dogs, isLoading } = useDogs()

  return (
    <>
      <Seo title="Aktywuj kod | ZELAK" noindex />

      <div className="container-content flex max-w-[70ch] flex-col gap-8 py-10">
        <header className="flex flex-col gap-3">
          <span className="font-heading text-[11px] uppercase tracking-wider text-muted">
            Kod od trenera
          </span>
          <h1 className="text-3xl lg:text-4xl">Aktywuj dostęp</h1>
          <p className="text-[15px] text-secondary">
            Wpisz kod, który dostałeś od trenera. Jeśli kod jest przypisany do adresu e-mail,
            zadziała tylko na koncie z tym adresem — jesteś zalogowany jako{' '}
            <span className="text-primary">{user?.email}</span>.
          </p>
        </header>

        {isLoading ? (
          <Loading className="min-h-[20vh]" />
        ) : dogs?.length ? (
          <section className="flex flex-col gap-4 rounded border border-line bg-surface p-5 sm:p-6">
            <CodeForm
              dogs={dogs}
              submitLabel="Aktywuj"
              onRedeemed={(data) => navigate(`/program/${data.program_slug}?pies=${data.dog_id}`)}
            />
          </section>
        ) : (
          <FirstDog />
        )}
      </div>
    </>
  )
}

function FirstDog() {
  const addDog = useAddDog()
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) addDog.mutate({ name: name.trim(), breed: breed.trim() || null })
      }}
      className="flex flex-col gap-4 rounded border border-line bg-surface p-5 sm:p-6"
    >
      <h2 className="font-heading text-sm uppercase tracking-wider text-muted">Najpierw Twój pies</h2>
      <p className="text-[15px] text-secondary">
        Kod otwiera plan dla konkretnego psa. Zdjęcie i datę urodzenia dodasz później w ustawieniach
        konta.
      </p>
      <Field label="Imię psa" required value={name} onChange={(e) => setName(e.target.value)} />
      <Field
        label="Rasa"
        value={breed}
        onChange={(e) => setBreed(e.target.value)}
        placeholder="np. owczarek belgijski"
      />
      {addDog.isError && <Notice tone="error">Nie udało się dodać psa. Spróbuj ponownie.</Notice>}
      <Button type="submit" disabled={addDog.isPending || !name.trim()} className="self-start">
        {addDog.isPending ? 'Dodaję…' : 'Dalej'}
      </Button>
    </form>
  )
}
