import { formatMoneyDigits } from "@/shared/lib/money";

/** Whole VND label; amount 0 displays as Free (FR5.1). */
export function formatVnd(amount: number): string {
  if (amount === 0) return "Free";
  return `${formatMoneyDigits(String(Math.trunc(amount)))} VND`;
}
