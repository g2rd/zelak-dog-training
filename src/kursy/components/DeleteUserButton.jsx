import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/kursy/components/Notice'
import { useDeleteUser } from '@/kursy/hooks/useProgram'

/**
 * Usunięcie konta kursanta z panelu trenera. Dwa kliknięcia: pierwsze
 * pokazuje, co dokładnie zniknie, drugie usuwa. Operacji nie da się cofnąć.
 *
 * @param {{ userId: string, label: string, onDeleted?: () => void }} props
 *   label — kogo usuwamy, np. „Jan (jan@example.com)”
 */
export function DeleteUserButton({ userId, label, onDeleted }) {
  const remove = useDeleteUser()
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <Button type="button" size="md" variant="ghost" onClick={() => setAsking(true)}>
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        Usuń konto
      </Button>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded border border-primary p-4">
      <p className="text-[15px] text-secondary">
        Usunąć konto <span className="text-primary">{label}</span>? Znikną też wszystkie psy tej
        osoby, zgłoszenia, odhaczenia, notatki, rozmowa z Tobą i zdjęcia. Tego nie da się cofnąć.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="md"
          disabled={remove.isPending}
          onClick={() => remove.mutate(userId, { onSuccess: () => onDeleted?.() })}
        >
          {remove.isPending ? 'Usuwam…' : 'Usuń na stałe'}
        </Button>
        <Button type="button" size="md" variant="outline" disabled={remove.isPending} onClick={() => setAsking(false)}>
          Anuluj
        </Button>
      </div>
      {remove.isError && (
        <Notice tone="error">
          Nie udało się usunąć konta. Jeśli to konto trenera, usuwa się je w panelu Supabase.
        </Notice>
      )}
    </div>
  )
}
