import { cn } from '@/lib/utils'

const sizeClass = {
  sm: 'fundamentals-logo--sm',
  md: 'fundamentals-logo--md',
  lg: 'fundamentals-logo--lg',
} as const

export type FundamentalsLogoProps = {
  className?: string
  /** Visual scale for headers vs compact chrome (sidebar, etc.). */
  size?: keyof typeof sizeClass
  /**
   * Render as a specific heading level, or {@code span} when nested in another heading.
   * @default 'span'
   */
  as?: 'span' | 'h1' | 'p'
}

/**
 * Wordmark for The Fundamentals — reusable across login, shell, and chrome.
 */
export function FundamentalsLogo({
  className,
  size = 'md',
  as: Tag = 'span',
}: FundamentalsLogoProps) {
  return (
    <Tag className={cn('fundamentals-logo', sizeClass[size], className)}>
      <span className="fundamentals-logo__mark" aria-hidden />
      <span className="fundamentals-logo__text">
        The Fundamentals
      </span>
    </Tag>
  )
}
