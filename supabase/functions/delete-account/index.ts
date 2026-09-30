// supabase/functions/delete-account/index.ts
//
// Usuwa konto (RODO — prawo do usunięcia danych). Dwa przypadki:
//  - kursant usuwa SWOJE konto (Konto → Usunięcie konta),
//  - trener usuwa konto kursanta z panelu /trener (`userId` w treści).
//
// Kasowanie wiersza w auth.users kaskadowo usuwa profil, psy, zgłoszenia,
// odhaczenia, notatki, wiadomości i dostęp do kursów (klucze obce
// `on delete cascade`). Pliki w magazynie nie mają kluczy obcych, więc
// zdjęcia psów (katalog `psy/<user_id>/`) usuwamy tu osobno.
//
// Uprawnienie trenera sprawdza baza (`is_trainer()` wywołane tokenem
// wołającego), nie frontend. Trener nie usunie innego trenera ani siebie
// tą drogą — własne konto usuwa się jak każdy, z ustawień konta.
//
// Wymaga klucza service_role (wstrzykiwany automatycznie jako
// SUPABASE_SERVICE_ROLE_KEY). Nikt nie ma prawa usunąć wiersza z auth.users
// bezpośrednio.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json, text } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return text(req, 'Method not allowed', 405)

  const asUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  )
  const { data: { user } } = await asUser.auth.getUser()
  if (!user) return text(req, 'Unauthorized', 401)

  // Potwierdzenie z frontendu — słowo USUWAM (kursant wpisuje je sam,
  // panel trenera wysyła je po drugim kliknięciu „Usuń na stałe”).
  let confirm: string | undefined
  let userId: string | undefined
  try {
    ;({ confirm, userId } = await req.json())
  } catch {
    return text(req, 'Bad request', 400)
  }
  if (confirm !== 'USUWAM') return text(req, 'Confirmation required', 400)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let target = user.id
  if (userId && userId !== user.id) {
    const { data: isTrainer, error: roleError } = await asUser.rpc('is_trainer')
    if (roleError || !isTrainer) return text(req, 'Forbidden', 403)

    const { data: targetIsTrainer } = await admin
      .from('trainers')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (targetIsTrainer) return text(req, 'Cannot delete a trainer', 409)

    target = userId
  }

  // Zdjęcia przed kontem: po usunięciu konta nikt już nie wskaże, czyje były.
  // Błąd tu nie blokuje usunięcia konta — osierocony plik jest mniejszym złem
  // niż konto, którego nie da się skasować.
  const photos = admin.storage.from('psy')
  const { data: files } = await photos.list(target, { limit: 1000 })
  if (files?.length) {
    const { error: removeError } = await photos.remove(files.map((f) => `${target}/${f.name}`))
    if (removeError) console.error(removeError)
  }

  const { error } = await admin.auth.admin.deleteUser(target)
  if (error) {
    console.error(error)
    // Nieistniejące konto (np. usunięte chwilę wcześniej w drugiej karcie).
    if (error.status === 404) return text(req, 'Not found', 404)
    return text(req, 'Delete failed', 500)
  }

  return json(req, { ok: true })
})
