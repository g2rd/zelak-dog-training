/**
 * Barrel strefy kursów — wszystko, co routes.jsx ładuje przez `lazyZone()`.
 *
 * Wszystkie eksporty pochodzą z JEDNEGO modułu, więc Vite pakuje strefę
 * w jeden chunk: supabase-js, React Query i react-markdown pobiera dopiero
 * ten, kto do strefy wejdzie.
 *
 * Dodajesz stronę w strefie? Wyeksportuj ją tutaj i dopisz trasę w routes.jsx.
 */
export { ZoneProviders } from '@/kursy/layout/ZoneProviders'
export { StrefaLayout } from '@/kursy/layout/StrefaLayout'
export { ProtectedRoute } from '@/kursy/auth/ProtectedRoute'

export { default as LoginPage } from '@/kursy/pages/LoginPage'
export { default as RegisterPage } from '@/kursy/pages/RegisterPage'
export { default as ResetPasswordPage } from '@/kursy/pages/ResetPasswordPage'
export { default as NewPasswordPage } from '@/kursy/pages/NewPasswordPage'

export { default as PanelPage } from '@/kursy/pages/PanelPage'
export { default as CoursesPage } from '@/kursy/pages/CoursesPage'
export { default as CoursePage } from '@/kursy/pages/CoursePage'
export { default as DayPage } from '@/kursy/pages/DayPage'
export { default as TaskPage } from '@/kursy/pages/TaskPage'
export { default as ActivatePage } from '@/kursy/pages/ActivatePage'
export { default as AccountPage } from '@/kursy/pages/AccountPage'
export { default as ProgramPage } from '@/kursy/pages/ProgramPage'
export { default as TrainerPage } from '@/kursy/pages/TrainerPage'
export { default as TrainerParticipantPage } from '@/kursy/pages/TrainerParticipantPage'
