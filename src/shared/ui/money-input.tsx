import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/cn";
import { formatMoneyDigits, parseMoneyDigits } from "@/shared/lib/money";

type MoneyInputProps = Omit<
  ComponentProps<"input">,
  "type" | "value" | "onChange" | "inputMode"
> & {
  /** Raw digit string (API amount in VND, no commas). */
  value: string;
  onValueChange: (digits: string) => void;
  /** Currency label rendered as a suffix. Default VND. */
  unit?: string;
};

/**
 * Amount field with thousand separators + unit suffix.
 * Separate from `Input` — currency UX shouldn't leak into the base text control.
 * Value in/out is always unformatted digits for validators / API.
 */
export function MoneyInput({
  value,
  onValueChange,
  unit = "VND",
  className,
  ...props
}: MoneyInputProps) {
  return (
    <div className="relative">
      <Input
        {...props}
        className={cn("pr-14 tabular-nums", className)}
        inputMode="numeric"
        onChange={(event) => onValueChange(parseMoneyDigits(event.target.value))}
        type="text"
        value={formatMoneyDigits(value)}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground"
      >
        {unit}
      </span>
    </div>
  );
}
