import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/cn";

/** Default section pending — thin header + a few quiet rows. */
export function SectionLoadingSkeleton({
  className,
  rows = 4,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div
      aria-busy
      aria-label="Loading"
      className={cn("flex flex-col gap-3 py-1", className)}
      data-testid="loading-screen"
      role="status"
    >
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-44 max-w-full" />
      </div>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton className="h-9 w-full rounded-md" key={i} />
        ))}
      </div>
    </div>
  );
}

/** Month grid placeholder for the Sessions calendar tab. */
export function CalendarLoadingSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading calendar"
      className="flex flex-col gap-3"
      data-testid="calendar-loading-skeleton"
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="size-7 rounded-md" />
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton className="mx-auto h-2.5 w-6" key={`dow-${i}`} />
        ))}
        {Array.from({ length: 35 }, (_, i) => (
          <Skeleton className="h-16 w-full rounded-md sm:h-[4.5rem]" key={`cell-${i}`} />
        ))}
      </div>
    </div>
  );
}

/** Hero + tab chrome while the classroom shell loads. */
export function ClassroomTabsLoadingSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading classroom"
      className="flex flex-col gap-5"
      data-testid="classroom-tabs-loading-skeleton"
      role="status"
    >
      <Skeleton className="h-40 w-full rounded-2xl sm:h-48" />
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex gap-1 border-b border-border/70 px-3 pt-2 pb-0">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton className="mb-2 h-7 w-20 rounded-md" key={i} />
          ))}
        </div>
        <div className="p-5">
          <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-52 max-w-full" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-28 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-14 rounded-md" />
            </div>
          </div>
          <CalendarLoadingSkeleton />
        </div>
      </div>
    </div>
  );
}
