import { QueryClient } from '@tanstack/react-query'

/**
 * Jedna instancja React Query dla całej strefy.
 *
 * Trzymana w module, a nie w stanie komponentu, żeby `AuthProvider` mógł ją
 * wyczyścić przy wylogowaniu — inaczej po zalogowaniu innej osoby na tym
 * samym urządzeniu przez chwilę widoczne byłyby dane poprzednika.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})
