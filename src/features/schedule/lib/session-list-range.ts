import {
  civilMonthRangeContaining,
  civilWeekRangeContaining,
  nextCivilMonthRange,
} from "./calendar-month";
import type { SessionDateRange } from "./session-api";
import { nowCivilInGmt7 } from "./session-time";

export type ListRangePreset = "this_week" | "this_month" | "next_month" | "custom";

export function rangeForPreset(
  preset: Exclude<ListRangePreset, "custom">,
  todayCivil: string = nowCivilInGmt7().date,
): SessionDateRange {
  if (preset === "this_week") return civilWeekRangeContaining(todayCivil);
  if (preset === "this_month") return civilMonthRangeContaining(todayCivil);
  return nextCivilMonthRange(todayCivil);
}
