import type { ReactNode } from "react";
import { School } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type AuthShellProps = {
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
};

/**
 * Shared auth frame. Atmosphere uses only NFR3 tokens (primary / accent / border
 * washes) — no second palette. Motion is CSS-only via tw-animate.
 * Brand mark + soft vignette give the shell a classroom-editorial presence
 * without leaving the U0 token set.
 */
export function AuthShell({ children, description, eyebrow = "Classroom", title }: AuthShellProps) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
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
      {/* Soft center vignette keeps the form readable against the washes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--background)_88%,transparent)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-8 p-6">
        <header className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4 duration-500 fill-mode-both">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                "border border-border bg-card text-primary shadow-sm",
                "ring-1 ring-primary/15",
              )}
            >
              <School className="size-5" strokeWidth={1.75} />
            </span>
            <p className="type-secondary tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="type-page text-foreground">{title}</h1>
            <span
              aria-hidden
              className="h-0.5 w-12 rounded-full bg-primary/70"
            />
            {description ? <p className="type-body text-muted-foreground">{description}</p> : null}
          </div>
        </header>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both delay-100">
          {children}
        </div>
      </div>
    </main>
  );
}
