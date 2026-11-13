import type { ReactNode } from "react";

type ClassroomShellProps = {
  children: ReactNode;
  /** Full page hero (banner + title + meta + actions) — one composition. */
  hero: ReactNode;
};

/**
 * Classroom page frame: single hero, then tabbed body.
 * Hero owns banner/title so empty-banner and titled layouts stay one unit.
 */
export function ClassroomShell({ children, hero }: ClassroomShellProps) {
  return (
    <div className="flex flex-col gap-6" data-testid="classroom-shell">
      {hero}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
