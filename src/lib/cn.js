import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Łączy klasy warunkowo (clsx) i rozwiązuje konflikty Tailwinda (tailwind-merge).
 * Dzięki temu `className` przekazany z zewnątrz zawsze wygrywa z domyślnym.
 * @param  {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
