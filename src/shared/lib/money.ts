/** Digits only from a typed amount (strips commas / spaces / currency). */
export function parseMoneyDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  // Drop leading zeros so "0" + "123" never becomes "0,123,…".
  const trimmed = digits.replace(/^0+/, "");
  return trimmed.length === 0 ? "0" : trimmed;
}

/** Thousand separators for display; empty stays empty. */
export function formatMoneyDigits(digits: string): string {
  if (digits.length === 0) return "";
  const normalized = parseMoneyDigits(digits);
  if (normalized.length === 0) return "";
  // Avoid Number() — large VND amounts stay exact as digit strings.
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
