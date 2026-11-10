import type { ButtonHTMLAttributes } from "react";

// Vitest stand-in for shadcn Button. The app resolves this import only after u0-design-system.
export function Button({ children, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button data-slot="button" type={type} {...props}>
      {children}
    </button>
  );
}
