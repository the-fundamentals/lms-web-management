import { School } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/cn";

type LoadingScreenProps = {
  /** Short status under the brand mark. Defaults to “Loading”. */
  label?: string;
  /** Optional muted hint under the label. */
  hint?: string;
};

/**
 * Full-viewport pending state. Reuses AuthShell atmosphere (NFR3 washes only)
 * so auth → Cognito and in-app fetches feel like the same product, not a
 * blank “Loading” page.
 */
export function LoadingScreen({
  label = "Loading",
  hint = "Just a moment",
}: LoadingScreenProps) {
  return (
    <div
      className="relative min-h-svh overflow-hidden bg-background text-foreground"
      data-testid="loading-screen"
      role="status"
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          "bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--accent)_55%,transparent),transparent_55%)]",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          "bg-[radial-gradient(ellipse_at_bottom_left,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_50%)]",
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:repeating-linear-gradient(-12deg,transparent,transparent_11px,color-mix(in_oklab,var(--border)_55%,transparent)_11px,color-mix(in_oklab,var(--border)_55%,transparent)_12px)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--background)_88%,transparent)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-sm flex-col items-center justify-center gap-8 p-6">
        <div className="animate-in fade-in zoom-in-95 flex flex-col items-center gap-5 duration-500 fill-mode-both">
          <div className="relative flex size-16 items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-primary/25 border-t-primary animate-spin"
            />
            <span
              aria-hidden
              className={cn(
                "flex size-12 items-center justify-center rounded-full",
                "border border-border bg-card text-primary shadow-sm",
                "ring-1 ring-primary/15",
              )}
            >
              <School className="size-5" strokeWidth={1.75} />
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="type-section text-foreground">{label}</p>
            {hint ? <p className="type-secondary text-muted-foreground">{hint}</p> : null}
            <span aria-hidden className="mt-1 h-0.5 w-10 rounded-full bg-primary/60" />
          </div>
        </div>

        <div
          aria-hidden
          className="animate-in fade-in slide-in-from-bottom-2 flex w-full flex-col gap-3 delay-150 duration-700 fill-mode-both"
        >
          <Skeleton className="h-3 w-3/5 rounded-full" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}
