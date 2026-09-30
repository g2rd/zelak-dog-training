import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { shrinkPhoto } from '@/kursy/lib/dogPhoto'

const PHOTO_BUCKET = 'psy'

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, marketing_consent, marketing_consent_at, created_at')
        .eq('id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }),
  })
}

export function useDogs() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['dogs', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, birth_date, photo_path')
        // Jawnie tylko własne psy. RLS pokazuje trenerowi także psy jego
        // kursantów — bez tego filtra trafiały do „Mój pies” i list wyboru.
        .eq('user_id', user.id)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useAddDog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dog) => {
      const { error } = await supabase.from('dogs').insert({ ...dog, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dogs', user?.id] }),
  })
}

export function useDeleteDog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dog) => {
      const { error } = await supabase.from('dogs').delete().eq('id', dog.id)
      if (error) throw error
      // Plik po usuniętym psie nikomu się nie przyda. Błąd tu nie cofa
      // usunięcia psa — najwyżej zostaje osierocony plik.
      if (dog.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([dog.photo_path])
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dogs', user?.id] }),
  })
}

/**
 * Nowe zdjęcie psa. Każde dostaje nową nazwę pliku — gdyby nadpisywać ten sam,
 * przeglądarka i CDN pokazywałyby jeszcze przez chwilę stare. Poprzedni plik
 * jest usuwany dopiero po zapisaniu nowej ścieżki.
 */
export function useSetDogPhoto() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ dog, file }) => {
      const blob = await shrinkPhoto(file)
      const path = `${user.id}/${dog.id}-${Date.now()}.jpg`
      const bucket = supabase.storage.from(PHOTO_BUCKET)

      const { error: uploadError } = await bucket.upload(path, blob, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { error } = await supabase.from('dogs').update({ photo_path: path }).eq('id', dog.id)
      if (error) {
        await bucket.remove([path])
        throw error
      }
      if (dog.photo_path) await bucket.remove([dog.photo_path])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['dog-photos'] })
    },
  })
}

/**
 * Podpisane linki do zdjęć psów, jednym zapytaniem dla całej listy.
 * Magazyn jest prywatny: własne zdjęcia widzi właściciel, zgłoszonych psów
 * trener. Zwraca mapę ścieżka → adres.
 */
export function useDogPhotoUrls(paths) {
  const list = [...new Set((paths ?? []).filter(Boolean))].sort()
  return useQuery({
    queryKey: ['dog-photos', list],
    enabled: list.length > 0,
    // Link żyje godzinę; odświeżamy po 50 minutach.
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(list, 3600)
      if (error) throw error
      return new Map(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
    },
  })
}
