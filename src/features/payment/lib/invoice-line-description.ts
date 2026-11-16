import { civilDateInGmt7 } from "@/shared/lib/gmt7";

/** ISO-8601 instants with optional fractional seconds and zone (or bare local form from API). */
const ISO_INSTANT =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g;

const MONTHS = [
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

function toParsableInstant(raw: string): string {
  // API often omits Z — treat bare date-times as UTC.
  if (/[Zz]$/.test(raw) || /[+-]\d{2}:?\d{2}$/.test(raw)) return raw;
  return `${raw}Z`;
}

function formatAttendedStamp(raw: string): string | null {
  const instant = new Date(toParsableInstant(raw));
  if (Number.isNaN(instant.getTime())) return null;
  const civil = civilDateInGmt7(instant);
  const year = civil.slice(0, 4);
  const month = Number(civil.slice(5, 7));
  const day = Number(civil.slice(8, 10));
  // Same GMT+7 shift as civilDateInGmt7 for the clock.
  const shifted = new Date(instant.getTime() + 7 * 60 * 60 * 1000);
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${day} ${MONTHS[month - 1]} ${year} · ${hh}:${mm}`;
}

export type InvoiceLineDescriptionView =
  | { kind: "plain"; text: string }
  | { kind: "attended"; label: string; stamps: string[] };

/**
 * If the line description embeds ISO timestamps (e.g. attended dates), extract and
 * format them in GMT+7. Otherwise keep the raw description.
 */
export function parseInvoiceLineDescription(description: string): InvoiceLineDescriptionView {
  const text = description.trim();
  if (!text) return { kind: "plain", text: description };

  const matches = text.match(ISO_INSTANT);
  if (!matches || matches.length === 0) {
    return { kind: "plain", text: description };
  }

  const stamps = matches
    .map(formatAttendedStamp)
    .filter((s): s is string => Boolean(s));
  if (stamps.length === 0) {
    return { kind: "plain", text: description };
  }

  const label = text.replace(ISO_INSTANT, "").replace(/^[\s,:;-]+|[\s,:;-]+$/g, "").trim();
  return {
    kind: "attended",
    label: label || "Attended",
    stamps,
  };
}
