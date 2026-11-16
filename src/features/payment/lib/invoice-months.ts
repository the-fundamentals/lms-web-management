import { civilDateInGmt7 } from "@/shared/lib/gmt7";
import type { InvoiceRow } from "./payment-api";

export type InvoiceMonthGroup = {
  /** `YYYY-MM` — GENERATED billingStart, or ADHOC created (GMT+7). */
  key: string;
  label: string;
  invoices: InvoiceRow[];
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseCivilDate(civil: string): { year: string; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civil);
  if (!match) return null;
  return { year: match[1]!, month: Number(match[2]), day: Number(match[3]) };
}

/** Civil year-month from an ISO instant in GMT+7. */
export function invoiceMonthKeyFromInstant(createdDate: string): string {
  return civilDateInGmt7(createdDate).slice(0, 7);
}

/**
 * Month bucket for list grouping.
 * GENERATED → `billingStart`; ADHOC → createdDate in GMT+7 (when the invoice was made).
 */
export function invoiceGroupingMonthKey(invoice: InvoiceRow): string {
  if (invoice.type === "GENERATED" && invoice.billingStart) {
    return invoice.billingStart.slice(0, 7);
  }
  return invoiceMonthKeyFromInstant(invoice.createdDate);
}

export function invoiceMonthLabel(key: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return key;
  const month = Number(match[2]);
  return `${MONTH_NAMES[month - 1]!} ${match[1]}`;
}

/** Short month from civil `YYYY-MM-DD`, e.g. `Oct 2026`. */
export function invoiceBillingMonthLabel(billingStart: string): string {
  const parsed = parseCivilDate(billingStart);
  if (!parsed) return billingStart;
  return `${MONTH_SHORT[parsed.month - 1]!} ${parsed.year}`;
}

/** Civil day short, e.g. `1 Oct`. */
export function civilDayShort(civil: string): string {
  const parsed = parseCivilDate(civil);
  if (!parsed) return civil;
  return `${parsed.day} ${MONTH_SHORT[parsed.month - 1]!}`;
}

/** Civil day with year, e.g. `31 Oct 2026`. */
export function civilDayWithYear(civil: string): string {
  const parsed = parseCivilDate(civil);
  if (!parsed) return civil;
  return `${parsed.day} ${MONTH_SHORT[parsed.month - 1]!} ${parsed.year}`;
}

/**
 * GENERATED billing window for the type badge.
 * Prefer `31 Oct 2026 – 29 Nov 2026` when both ends exist; else month from start.
 */
export function invoiceBillingWindowLabel(
  billingStart: string,
  billingEnd?: string,
): string {
  if (billingEnd) {
    return `${civilDayWithYear(billingStart)} – ${civilDayWithYear(billingEnd)}`;
  }
  return invoiceBillingMonthLabel(billingStart);
}

/** Short civil day of createdDate in GMT+7, e.g. `13 Nov`. */
export function invoiceCreatedDayLabel(createdDate: string): string {
  const civil = civilDateInGmt7(createdDate);
  const day = Number(civil.slice(8, 10));
  const month = Number(civil.slice(5, 7));
  return `${day} ${MONTH_SHORT[month - 1]!}`;
}

/**
 * Row secondary meta (beside badges). Empty string when nothing to show.
 * GENERATED → billing window only (never note / created).
 * ADHOC → created day (when the invoice was made).
 */
export function invoiceRowMeta(invoice: InvoiceRow): string {
  if (invoice.type === "GENERATED") {
    if (!invoice.billingStart) return "";
    return invoiceBillingWindowLabel(invoice.billingStart, invoice.billingEnd);
  }
  return invoiceCreatedDayLabel(invoice.createdDate);
}

/** Newest month first; invoices keep caller order within each month. */
export function groupInvoicesByMonth(invoices: InvoiceRow[]): InvoiceMonthGroup[] {
  const map = new Map<string, InvoiceRow[]>();
  for (const invoice of invoices) {
    const key = invoiceGroupingMonthKey(invoice);
    const bucket = map.get(key);
    if (bucket) bucket.push(invoice);
    else map.set(key, [invoice]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, rows]) => ({
      key,
      label: invoiceMonthLabel(key),
      invoices: rows,
    }));
}
