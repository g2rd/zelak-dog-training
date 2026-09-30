import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { scrollToSection } from '@/utils/scrollToSection'

const VARIANTS = {
  // Wypełniony — hover odwraca kolory (animations.buttons.hover = invert-colors).
  primary:
    'bg-primary text-ink border border-primary hover:bg-transparent hover:text-primary',
  // Obrysowany — hover wypełnia.
  outline:
    'bg-transparent text-primary border border-line hover:bg-primary hover:text-ink hover:border-primary',
  // Tekstowy z podkreśleniem.
  ghost:
    'bg-transparent text-secondary border border-transparent hover:text-primary px-0',
}

const SIZES = {
  md: 'h-11 px-6 text-[13px]',
  lg: 'h-14 px-8 text-sm',
}

/**
 * Uniwersalny przycisk. Renderuje <a>, <Link> albo <button> zależnie od propsów:
 * - `to`     → react-router <Link> (nawigacja między stronami)
 * - `href`   → zwykły <a> (tel:, mailto:, linki zewnętrzne)
 * - `target` → kotwica na tej samej stronie, przewijana programowo
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  target,
  className,
  onClick,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded font-heading uppercase tracking-wider',
    'transition-colors duration-200 ease-out select-none whitespace-nowrap',
    SIZES[size],
    VARIANTS[variant],
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    const isExternal = href.startsWith('http')
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    )
  }

  if (target) {
    // Zostawiamy prawdziwy <a href="#...">, żeby link dało się otworzyć w nowej
    // karcie i był czytelny dla czytników ekranu; scroll przejmujemy tylko po to,
    // by uwzględnić wysokość navbara.
    return (
      <a
        href={target}
        className={classes}
        onClick={(event) => {
          if (scrollToSection(target)) event.preventDefault()
          onClick?.(event)
        }}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  )
}
