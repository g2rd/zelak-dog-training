import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

const TONES = {
  info: { Icon: Info, role: 'status', ring: 'border-line' },
  success: { Icon: CheckCircle2, role: 'status', ring: 'border-primary' },
  warning: { Icon: AlertTriangle, role: 'status', ring: 'border-secondary' },
  error: { Icon: XCircle, role: 'alert', ring: 'border-primary' },
}

/**
 * Komunikat w ramce. Monochromatyczna paleta marki nie ma zieleni ani
 * czerwieni, więc ton rozróżnia ikona i grubość obramowania, nie kolor.
 */
export function Notice({ tone = 'info', title, children, className, action }) {
  const { Icon, role, ring } = TONES[tone] ?? TONES.info
  return (
    <div
      role={role}
      className={cn('flex gap-3 rounded border bg-surface p-4 text-[15px] text-secondary', ring, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
      <div className="flex flex-1 flex-col gap-2">
        {title && <p className="font-heading text-sm uppercase tracking-wider text-primary">{title}</p>}
        {children && <div className="flex flex-col gap-2">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  )
}
