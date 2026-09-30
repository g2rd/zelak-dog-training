import { Dog } from 'lucide-react'
import { cn } from '@/lib/cn'

const SIZES = {
  sm: 'h-11 w-11',
  md: 'h-16 w-16',
  lg: 'h-28 w-28',
}

/**
 * Zdjęcie psa albo ikonka, gdy zdjęcia nie ma. Adres podaje rodzic
 * (`useDogPhotoUrls` — jedno zapytanie na całą listę zamiast jednego na psa).
 */
export function DogAvatar({ url, name, size = 'sm', className }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-dark text-muted',
        SIZES[size],
        className,
      )}
    >
      {url ? (
        <img src={url} alt={name ? `Pies ${name}` : ''} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <Dog aria-hidden="true" className="h-1/2 w-1/2" strokeWidth={1.4} />
      )}
    </span>
  )
}
