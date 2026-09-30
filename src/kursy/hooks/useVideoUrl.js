import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Podpisany link do filmu, ważny 2 godziny. Pobierany dopiero, gdy zadanie
 * jest rozwinięte (`enabled`) — oszczędza transfer i wywołania funkcji.
 */
export function useVideoUrl(taskId, enabled) {
  return useQuery({
    queryKey: ['video-url', taskId],
    enabled: Boolean(taskId) && enabled,
    // Link żyje 2 h; odświeżamy po 90 min, żeby nie trafić na wygasły.
    staleTime: 90 * 60_000,
    gcTime: 2 * 60 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('video-url', { body: { taskId } })
      if (error) {
        const status = error.context?.status
        if (status === 403) throw new Error('Ten film jest dostępny tylko dla osób z dostępem do kursu.')
        throw new Error('Nie udało się wczytać filmu. Spróbuj ponownie.')
      }
      return data.url
    },
  })
}
