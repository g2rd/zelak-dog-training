import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { currentDay } from '@/kursy/lib/currentDay'

/** Wszystkie dostępy zalogowanego użytkownika (RLS zwraca tylko własne). */
export function useMyEnrollments() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['enrollments', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, course_id, plan, started_at, expires_at, courses(id, slug, title, description, duration_days)')
        .order('started_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/**
 * Stan dostępu do konkretnego kursu, wyliczony z listy enrollmentów.
 *
 * @returns {{
 *   enrollment: object|null, hasAccess: boolean, plan: 'basic'|'premium'|null,
 *   startedAt: string|null, expiresAt: string|null, expired: boolean, current: number,
 *   isLoading: boolean, error: unknown
 * }}
 */
export function useEnrollment(courseId, durationDays = 60) {
  const query = useMyEnrollments()

  return useMemo(() => {
    const enrollment = query.data?.find((e) => e.course_id === courseId) ?? null
    const expiresAt = enrollment?.expires_at ?? null
    const expired = Boolean(expiresAt) && new Date(expiresAt) <= new Date()
    const hasAccess = Boolean(enrollment) && !expired

    return {
      enrollment,
      hasAccess,
      plan: enrollment?.plan ?? null,
      startedAt: enrollment?.started_at ?? null,
      expiresAt,
      expired,
      current: enrollment ? currentDay(enrollment.started_at, durationDays) : 0,
      isLoading: query.isLoading,
      error: query.error,
    }
  }, [query.data, query.isLoading, query.error, courseId, durationDays])
}
