import { describe, expect, it } from "vitest";
import {
  clockHm,
  formatSessionClockRange,
  formatSessionWhen,
  minutesOfDay,
  sessionDateParts,
  sessionEndCivilDate,
  sessionEndInstant,
  sessionStartInstant,
} from "./session-time";

describe("session time helpers", () => {
  it("normalizes HH:MM:SS to HH:MM", () => {
    expect(clockHm("09:00:00")).toBe("09:00");
    expect(clockHm("09:00")).toBe("09:00");
  });

  it("midnight-cross end falls on the next civil date", () => {
    expect(sessionEndCivilDate("2026-07-19", "22:00:00", "01:00:00")).toBe("2026-07-20");
    expect(sessionEndCivilDate("2026-07-19", "09:00:00", "10:00:00")).toBe("2026-07-19");
  });

  it("minutesOfDay maps clock to minutes from midnight", () => {
    expect(minutesOfDay("00:00")).toBe(0);
    expect(minutesOfDay("09:30:00")).toBe(9 * 60 + 30);
    expect(minutesOfDay("23:59")).toBe(23 * 60 + 59);
  });

  it("format includes GMT+7 and next-date end when needed", () => {
    expect(formatSessionWhen("2026-07-19", "09:00:00", "10:00:00")).toBe(
      "2026-07-19 09:00 – 10:00 GMT+7",
    );
    expect(formatSessionWhen("2026-07-19", "22:00:00", "01:00:00")).toBe(
      "2026-07-19 22:00 – 2026-07-20 01:00 GMT+7",
    );
  });

  it("start/end instants use GMT+7 civil boundary", () => {
    expect(sessionStartInstant("2026-07-19", "09:00:00")).toBe("2026-07-19T02:00:00.000Z");
    expect(sessionEndInstant("2026-07-19", "22:00:00", "01:00:00")).toBe(
      "2026-07-19T18:00:00.000Z",
    );
  });

  it("date parts and clock range suit list rows", () => {
    expect(sessionDateParts("2026-11-13")).toEqual({
      day: "13",
      weekday: "Fri",
      month: "Nov",
      label: "Fri, 13 Nov",
    });
    expect(formatSessionClockRange("2026-11-13", "21:00:00", "22:30:00")).toBe(
      "21:00 – 22:30",
    );
    expect(formatSessionClockRange("2026-11-13", "22:00:00", "01:00:00")).toBe(
      "22:00 – 01:00 (+1 day)",
    );
  });
});
