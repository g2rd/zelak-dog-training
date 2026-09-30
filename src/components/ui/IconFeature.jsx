import { Activity, MessageCircle, ShieldCheck, Target } from 'lucide-react'

// Mapowanie nazw ikon z konfiguracji na komponenty — trzymamy je jawnie,
// żeby bundler mógł usunąć nieużywane ikony (brak importu całej biblioteki).
const ICONS = {
  'message-circle': MessageCircle,
  target: Target,
  activity: Activity,
  'shield-check': ShieldCheck,
}

/**
 * Pojedyncza wartość / filar podejścia treningowego.
 */
export function IconFeature({ icon, title, description }) {
  const Icon = ICONS[icon] ?? Target

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-7">
      <Icon aria-hidden="true" className="h-6 w-6 text-primary" strokeWidth={1.5} />
      <h3 className="text-lg lg:text-xl">{title}</h3>
      <p className="text-[15px] text-secondary">{description}</p>
    </div>
  )
}
