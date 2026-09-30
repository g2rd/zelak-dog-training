import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { logKey } from '@/kursy/lib/program'

/**
 * Dane programu stacjonarnego („Fundament").
 *
 * Kto co widzi, rozstrzyga RLS: treść kart przychodzi tylko do zatwierdzonych
 * kursantów i trenera. Oczekujący dostaje sam program, bez spotkań — i tak
 * ma wyglądać ekran „czekasz na zatwierdzenie".
 */

const SESSION_FIELDS =
  'id, number, title, promise, agenda, theory, tip, outro, pdf_path, ' +
  'session_items(id, kind, position, label, frequency)'

/** Opublikowane programy do katalogu. */
export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, slug, title, subtitle, description')
        .eq('is_published', true)
        .order('title')
      if (error) throw error
      return data
    },
  })
}

/** Program po slugu razem ze spotkaniami (puste, jeśli RLS ich nie wyda). */
export function useProgram(slug) {
  return useQuery({
    queryKey: ['program', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select(`id, slug, title, subtitle, description, free_sessions, program_sessions(${SESSION_FIELDS})`)
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const sessions = [...(data.program_sessions ?? [])].sort((a, b) => a.number - b.number)
      return { ...data, sessions }
    },
  })
}

/**
 * Spis spotkań do paska: numer, tytuł i czy otwarte. Zamknięte karty nie
 * przychodzą w `useProgram` (RLS), więc bez spisu kłódek nie byłoby czego
 * narysować.
 */
export function useProgramOutline(programId) {
  return useQuery({
    queryKey: ['program-outline', programId],
    enabled: Boolean(programId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('program_outline', { p_program_id: programId })
      if (error) throw error
      return data
    },
  })
}

/** Zgłoszenia zalogowanego (RLS: tylko własne), z psem i programem. */
export function useMyParticipations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['participations', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participants')
        .select(
          'id, status, current_session, applied_at, approved_at, expires_at, unlocked_all, program_id, dog_id, ' +
            'dogs(id, name, breed, photo_path), programs(id, slug, title)',
        )
        .eq('user_id', user.id)
        .order('applied_at')
      if (error) throw error
      return data
    },
  })
}

/** Zgłoszenie bez kodu — czeka na zatwierdzenie trenera. */
export function useApplyToProgram() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ slug, dogId }) => {
      const { data, error } = await supabase.rpc('apply_to_program', {
        p_program_slug: slug,
        p_dog_id: dogId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['participations', user?.id] }),
  })
}

/**
 * Wejście z kodem od trenera. Kod sam wie, do którego programu prowadzi,
 * więc wystarczy kod i pies. Zwraca `{ participant_id, dog_id, program_slug,
 * expires_at }`.
 */
export function useRedeemCode() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ code, dogId }) => {
      const { data, error } = await supabase.rpc('redeem_access_code', {
        p_code: code,
        p_dog_id: dogId,
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['participations', user?.id] })
      // Otwarty dostęp odsłania spotkania — trzeba je dociągnąć na nowo.
      queryClient.invalidateQueries({ queryKey: ['program', data?.program_slug] })
    },
  })
}

// ---------------------------------------------------------------------------
// Odhaczenia
// ---------------------------------------------------------------------------

const logQueryKey = (participantId) => ['item-log', participantId]

/**
 * Odhaczenia jednego zgłoszenia jako zbiór kluczy `element:dzień`.
 * Ten sam hook czyta kursant (własne) i trener (dowolne) — RLS pilnuje reszty.
 */
export function useItemLog(participantId) {
  const query = useQuery({
    queryKey: logQueryKey(participantId),
    enabled: Boolean(participantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_log')
        .select('item_id, day, done_at')
        .eq('participant_id', participantId)
      if (error) throw error
      return data
    },
  })
  const done = useMemo(
    () => new Set((query.data ?? []).map((row) => logKey(row.item_id, row.day))),
    [query.data],
  )
  return { ...query, done }
}

/**
 * Odhaczenie kratki z optymistycznym UI — jak w kursach online. Duplikat
 * (23505) to sukces: drugie urządzenie zdążyło pierwsze.
 */
export function useToggleItem(participantId) {
  const queryClient = useQueryClient()
  const key = logQueryKey(participantId)

  return useMutation({
    mutationFn: async ({ itemId, day, done }) => {
      if (done) {
        const { error } = await supabase
          .from('item_log')
          .insert({ participant_id: participantId, item_id: itemId, day })
        if (error && error.code !== '23505') throw error
        return
      }
      const { error } = await supabase
        .from('item_log')
        .delete()
        .eq('participant_id', participantId)
        .eq('item_id', itemId)
        .eq('day', day)
      if (error) throw error
    },
    onMutate: async ({ itemId, day, done }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old = []) =>
        done
          ? [...old, { item_id: itemId, day, done_at: new Date().toISOString() }]
          : old.filter((row) => !(row.item_id === itemId && row.day === day)),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

// ---------------------------------------------------------------------------
// Notatki
// ---------------------------------------------------------------------------

export function useNotes(participantId) {
  return useQuery({
    queryKey: ['notes', participantId],
    enabled: Boolean(participantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participant_notes')
        .select('session_id, body, updated_at')
        .eq('participant_id', participantId)
      if (error) throw error
      return new Map(data.map((n) => [n.session_id, n]))
    },
  })
}

export function useSaveNote(participantId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, body }) => {
      const { error } = await supabase.from('participant_notes').upsert({
        participant_id: participantId,
        session_id: sessionId,
        body,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes', participantId] }),
  })
}

// ---------------------------------------------------------------------------
// Wiadomości kursant ↔ trener
// ---------------------------------------------------------------------------

/**
 * Wątek jednego zgłoszenia. Odświeżany co minutę, gdy ekran jest otwarty —
 * bez kanału realtime, bo przy jednym trenerze i kilkunastu kursantach
 * minuta opóźnienia nic nie zmienia, a to o jedno połączenie mniej.
 */
export function useMessages(participantId) {
  return useQuery({
    queryKey: ['messages', participantId],
    enabled: Boolean(participantId),
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, session_id, author_id, body, created_at, read_at')
        .eq('participant_id', participantId)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useSendMessage(participantId) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ body, sessionId }) => {
      const { error } = await supabase.from('messages').insert({
        participant_id: participantId,
        session_id: sessionId ?? null,
        author_id: user.id,
        body,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', participantId] }),
  })
}

export function useMarkThreadRead(participantId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_thread_read', { p_participant_id: participantId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', participantId] })
      queryClient.invalidateQueries({ queryKey: ['trainer-overview'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Karta w PDF
// ---------------------------------------------------------------------------

/**
 * Link do PDF-a karty, ważny godzinę. Pobierany dopiero po kliknięciu.
 *
 * Kartę otwieramy SYNCHRONICZNIE w chwili kliknięcia, a adres wstawiamy po
 * podpisaniu. `window.open` wywołane dopiero po `await` Safari traktuje jak
 * wyskakujące okienko i blokuje.
 */
export async function openSessionPdf(path) {
  const win = window.open('', '_blank')
  try {
    const { data, error } = await supabase.storage.from('karty').createSignedUrl(path, 3600)
    if (error) throw error
    if (win) {
      win.opener = null
      win.location.href = data.signedUrl
    } else {
      window.location.assign(data.signedUrl)
    }
  } catch (error) {
    win?.close()
    throw error
  }
}

// ---------------------------------------------------------------------------
// Trener
// ---------------------------------------------------------------------------

/**
 * Czy zalogowany jest trenerem. Tylko do rysowania interfejsu — każde
 * zapytanie trenera i tak przechodzi przez `is_trainer()` w bazie.
 */
export function useIsTrainer() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['is-trainer', user?.id],
    enabled: Boolean(user),
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_trainer')
      if (error) throw error
      return Boolean(data)
    },
  })
}

export function useTrainerOverview() {
  return useQuery({
    queryKey: ['trainer-overview'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('trainer_overview')
      if (error) throw error
      return data
    },
  })
}

/** Jedno zgłoszenie z perspektywy trenera: pies, opiekun, program. */
export function useTrainerParticipant(participantId) {
  return useQuery({
    queryKey: ['trainer-participant', participantId],
    enabled: Boolean(participantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participants')
        .select(
          'id, user_id, status, current_session, applied_at, approved_at, finished_at, expires_at, unlocked_all, ' +
            'dogs(id, name, breed, birth_date, photo_path), programs(id, slug, title)',
        )
        .eq('id', participantId)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      // Profil osobno: `participants.user_id` wskazuje na auth.users, nie na
      // profiles, więc PostgREST nie dociągnie go relacją.
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', data.user_id)
        .maybeSingle()
      return { ...data, profile }
    },
  })
}

export function useUpdateParticipant(participantId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch) => {
      const { error } = await supabase.from('participants').update(patch).eq('id', participantId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-participant', participantId] })
      queryClient.invalidateQueries({ queryKey: ['trainer-overview'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Kody dostępu (tylko trener — RLS i funkcje w bazie odmawiają pozostałym)
// ---------------------------------------------------------------------------

export function useAccessCodes() {
  return useQuery({
    queryKey: ['access-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_codes')
        .select('id, code, email, note, created_at, redeemed_at, revoked_at, program_id, participant_id')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCreateAccessCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ programId, email, note }) => {
      const { data, error } = await supabase.rpc('create_access_code', {
        p_program_id: programId,
        p_email: email || null,
        p_note: note || null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-without-access'] })
    },
  })
}

/**
 * Konta, które nie mają jeszcze żadnego zgłoszenia — żeby trener mógł dać
 * kod komuś, kto dopiero się zarejestrował. Funkcja w bazie odmawia
 * każdemu poza trenerem.
 */
export function useAccountsWithoutAccess() {
  return useQuery({
    queryKey: ['accounts-without-access'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('trainer_accounts_without_access')
      if (error) throw error
      return data
    },
  })
}

export function useRevokeAccessCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (codeId) => {
      const { error } = await supabase.rpc('revoke_access_code', { p_code_id: codeId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-without-access'] })
    },
  })
}

/**
 * Usunięcie konta kursanta przez trenera — razem z psami, zgłoszeniami,
 * postępami, rozmową i zdjęciami. Uprawnienie sprawdza Edge Function
 * `delete-account` (wywołuje `is_trainer()` tokenem trenera).
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId) => {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { confirm: 'USUWAM', userId },
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-overview'] })
      queryClient.invalidateQueries({ queryKey: ['accounts-without-access'] })
      queryClient.invalidateQueries({ queryKey: ['access-codes'] })
    },
  })
}

/** Programy dla formularza kodów — trener widzi też nieopublikowane. */
export function useTrainerPrograms() {
  return useQuery({
    queryKey: ['trainer-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, slug, title, access_months')
        .order('title')
      if (error) throw error
      return data
    },
  })
}
