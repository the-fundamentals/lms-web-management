const GMT7_OFFSET_MS = 7 * 60 * 60 * 1000;

function asInstant(value: string | Date): Date {
  const instant = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(instant.getTime())) {
    throw new Error("Expected an instant");
  }
  return instant;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

// Vietnam has no daylight-saving change, so the civil clock is UTC plus a fixed 7 hours.
function shiftToGmt7(instant: Date): Date {
  return new Date(instant.getTime() + GMT7_OFFSET_MS);
}

function civilDate(shifted: Date): string {
  const year = shifted.getUTCFullYear();
  const month = pad(shifted.getUTCMonth() + 1);
  const day = pad(shifted.getUTCDate());
  return `${year}-${month}-${day}`;
}

export function formatInstantInGmt7(value: string | Date): string {
  const shifted = shiftToGmt7(asInstant(value));
  const hours = pad(shifted.getUTCHours());
  const minutes = pad(shifted.getUTCMinutes());
  return `${civilDate(shifted)} ${hours}:${minutes} GMT+7`;
}

export function civilDateInGmt7(value: string | Date): string {
  return civilDate(shiftToGmt7(asInstant(value)));
}

export function gmt7Offset(value: string | Date): "+07:00" {
  asInstant(value);
  return "+07:00";
}

// Boundary conversion for a value the server stores as an instant. Session and weekly clock times stay civil values in the schedule unit and call this only for an instant field.
export function instantFromGmt7(civilDate: string, clockTime: string): string {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  const time = /^(\d{2}):(\d{2})$/.exec(clockTime);
  if (!date || !time) {
    throw new Error("Expected a GMT+7 calendar date and clock time");
  }
  const shifted = Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3]), Number(time[1]), Number(time[2]));
  return new Date(shifted - GMT7_OFFSET_MS).toISOString();
}
