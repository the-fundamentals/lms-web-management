import { describe, expect, it } from "vitest";
import {
  canShiftYearMonth,
  civilMonthRange,
  civilMonthRangeContaining,
  civilWeekRangeContaining,
  clampCivilRangeToHorizon,
  maxFutureCivilDate,
  maxFutureYearMonth,
  nextCivilMonthRange,
} from "./calendar-month";

describe("calendar month ranges", () => {
  it("civilMonthRange is first–last day of the month", () => {
    expect(civilMonthRange(2026, 11)).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(civilMonthRange(2026, 2)).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("civilWeekRangeContaining is Mon–Sun around the date", () => {
    // 2026-11-13 is Friday → Mon 9 … Sun 15
    expect(civilWeekRangeContaining("2026-11-13")).toEqual({
      from: "2026-11-09",
      to: "2026-11-15",
    });
    // Monday stays the week start
    expect(civilWeekRangeContaining("2026-11-09")).toEqual({
      from: "2026-11-09",
      to: "2026-11-15",
    });
  });

  it("max future month is current + 3", () => {
    // 2026-11-13 GMT+7 → Feb 2027
    const now = new Date("2026-11-13T05:00:00.000Z");
    expect(maxFutureYearMonth(now)).toEqual({ year: 2027, month: 2 });
    expect(maxFutureCivilDate(now)).toBe("2027-02-28");
  });

  it("canShiftYearMonth allows past, blocks past the horizon", () => {
    const now = new Date("2026-11-13T05:00:00.000Z");
    expect(canShiftYearMonth(2026, 11, -1, now)).toBe(true);
    expect(canShiftYearMonth(2027, 2, 1, now)).toBe(false);
    expect(canShiftYearMonth(2027, 1, 1, now)).toBe(true);
  });

  it("list preset month helpers", () => {
    expect(civilMonthRangeContaining("2026-11-13")).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
    });
    expect(nextCivilMonthRange("2026-11-13")).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
  });

  it("clampCivilRangeToHorizon caps the end date", () => {
    const now = new Date("2026-11-13T05:00:00.000Z");
    expect(
      clampCivilRangeToHorizon({ from: "2026-11-01", to: "2027-06-01" }, now),
    ).toEqual({ from: "2026-11-01", to: "2027-02-28" });
  });
});
