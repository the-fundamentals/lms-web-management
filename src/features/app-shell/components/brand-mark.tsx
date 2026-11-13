/** Fundamentals mark — stacked foundation blocks (not a school glyph). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={
        className ??
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      }
      data-testid="brand-mark"
    >
      <svg fill="none" height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg">
        <rect fill="currentColor" height="3.5" rx="0.75" width="14" x="2" y="12.5" />
        <rect fill="currentColor" height="3.5" opacity="0.85" rx="0.75" width="10" x="4" y="7.5" />
        <rect fill="currentColor" height="3.5" opacity="0.7" rx="0.75" width="6" x="6" y="2.5" />
      </svg>
    </span>
  );
}
