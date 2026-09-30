import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** Katalog opublikowanych kursów (RLS: `is_published = true`). */
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, slug, title, description, cover_url, duration_days')
        .order('title')
      if (error) throw error
      return data
    },
  })
}

/**
 * Jeden kurs po slugu, razem z listą dni (tytuły są publiczne).
 * Zwraca `null`, gdy kurs nie istnieje albo nie jest opublikowany.
 */
export function useCourse(slug) {
  return useQuery({
    queryKey: ['course', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(
          'id, slug, title, description, cover_url, duration_days, ' +
            'course_days(id, day_number, title, intro_md, is_free_preview)',
        )
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      if (!data) return null

      const days = [...(data.course_days ?? [])].sort((a, b) => a.day_number - b.day_number)
      return { ...data, days }
    },
  })
}
