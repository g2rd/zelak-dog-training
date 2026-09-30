import { useVideoUrl } from '@/kursy/hooks/useVideoUrl'
import { useAuth } from '@/kursy/auth/AuthProvider'
import { Notice } from '@/kursy/components/Notice'
import { Watermark } from '@/kursy/components/Watermark'

/**
 * Odtwarzacz Bunny Stream.
 *
 * Link jest podpisany i ważny 2 godziny — wydaje go Edge Function `video-url`,
 * która pyta bazę o zadanie z tokenem użytkownika. Brak dostępu = 403 i film
 * się nie pojawia. Frontend nigdy nie zna identyfikatora biblioteki ani klucza.
 *
 * `enabled` steruje momentem pobrania: link ściągamy dopiero po rozwinięciu
 * zadania, więc lista dnia nie wywołuje funkcji raz na każde zadanie.
 *
 * Na wierzchu leży znak wodny z adresem kupującego (patrz Watermark) — nie
 * blokuje niczego, ale pozwala przypisać ewentualny wyciek do konta.
 */
export function VideoPlayer({ taskId, enabled = true, title = 'Film do zadania' }) {
  const { data: url, isLoading, error } = useVideoUrl(taskId, enabled)
  const { user } = useAuth()

  if (!enabled) return null

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex aspect-video w-full items-center justify-center rounded border border-line bg-dark font-heading text-[11px] uppercase tracking-wider text-muted"
      >
        Wczytuję film…
      </div>
    )
  }

  if (error) {
    return <Notice tone="error">{error.message}</Notice>
  }

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded border border-line bg-black">
        <iframe
          src={url}
          title={title}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
        <Watermark email={user?.email} />
      </div>

      {/* Zdanie widoczne obok filmu robi połowę roboty za sam znak wodny.
          Odstrasza wiedza, że materiał jest oznaczony, a nie sam napis. */}
      {user?.email && (
        <figcaption className="text-sm text-muted">
          Materiał oznaczony Twoim adresem e-mail. Udostępnianie go dalej narusza regulamin
          i kończy się zablokowaniem dostępu.
        </figcaption>
      )}
    </figure>
  )
}
