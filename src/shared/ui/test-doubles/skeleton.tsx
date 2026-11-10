import type { HTMLAttributes } from "react";

// Vitest stand-in for shadcn Skeleton. The app resolves this import only after u0-design-system.
export function Skeleton(props: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="skeleton" {...props} />;
}
