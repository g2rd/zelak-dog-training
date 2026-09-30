import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/kursy/auth/AuthProvider'

const progressKey = (userId) => ['progress', userId]

/**
 * Identyfikatory ukończonych zadań zalogowanego użytkownika.
 * W cache trzymamy tablicę (łatwo ją optymistycznie modyfikować),
 * a na zewnątrz dajemy Set — sprawdzanie `has()` w liście zadań jest O(1).
 */
export function useProgress() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: progressKey(user?.id),
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from('task_progress').select('task_id')
      if (error) throw error
      return data.map((row) => row.task_id)
    },
  })

  const doneIds = useMemo(() => new Set(query.data ?? []), [query.data])
  return { ...query, doneIds }
}

/**
 * Zapis odhaczenia. Insert z duplikatem (23505) traktujemy jak sukces — to
 * znaczy, że drugie urządzenie zdążyło pierwsze.
 */
export async function toggleTask(taskId, done, userId) {
  if (done) {
    const { error } = await supabase.from('task_progress').insert({ task_id: taskId, user_id: userId })
    if (error && error.code !== '23505') throw error
    return
  }
  const { error } = await supabase
    .from('task_progress')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId)
  if (error) throw error
}

/**
 * Mutacja z optymistycznym UI: checkbox zmienia stan natychmiast, a jeśli
 * serwer odmówi (np. dzień jeszcze zablokowany), wraca do poprzedniego stanu.
 */
export function useToggleTask() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const key = progressKey(user?.id)

  return useMutation({
    mutationFn: ({ taskId, done }) => toggleTask(taskId, done, user.id),
    onMutate: async ({ taskId, done }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old = []) =>
        done ? Array.from(new Set([...old, taskId])) : old.filter((id) => id !== taskId),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
