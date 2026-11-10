import type { HTMLAttributes } from "react";

// Vitest stand-in for shadcn Alert. The app resolves this import only after u0-design-system.
export function Alert({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="alert" role="alert" {...props}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="alert-description" {...props}>
      {children}
    </div>
  );
}
