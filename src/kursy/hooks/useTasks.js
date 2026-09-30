import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Lekka lista zadań całego kursu — do siatki dni i paska postępu.
 *
 * Baza zwraca WYŁĄCZNIE zadania z dni odblokowanych (polityka „tasks unlocked"),
 * więc dla dni zablokowanych lista jest po prostu pusta. Nie jest to błąd.
 */
export function useCourseTasks(courseId) {
  return useQuery({
    queryKey: ['tasks', courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, course_day_id, position, title, duration_min, bunny_video_id, course_days!inner(course_id)')
        .eq('course_days.course_id', courseId)
        .order('position')
      if (error) throw error
      // Relacja była potrzebna tylko do filtra — nie ciągniemy jej dalej.
      return data.map(({ course_days: _omit, ...task }) => task)
    },
  })
}

/** Pełne zadania jednego dnia, z instrukcją. */
export function useDayTasks(dayId) {
  return useQuery({
    queryKey: ['day-tasks', dayId],
    enabled: Boolean(dayId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, course_day_id, position, title, instructions_md, bunny_video_id, duration_min')
        .eq('course_day_id', dayId)
        .order('position')
      if (error) throw error
      return data
    },
  })
}

/** Jedno zadanie (widok pełnoekranowy). `null`, gdy brak dostępu. */
export function useTask(taskId) {
  return useQuery({
    queryKey: ['task', taskId],
    enabled: Boolean(taskId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, course_day_id, position, title, instructions_md, bunny_video_id, duration_min')
        .eq('id', taskId)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}
