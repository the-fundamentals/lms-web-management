import { describe, expect, it } from "vitest";
import {
  civilDateToByDay,
  isCancelledOccurrence,
  isCutoffForward,
  isRecurrenceOccurrence,
  matchSessionRecurrence,
} from "./truncate-calendar";
import type { RecurrenceRow } from "./session-api";

function row(partial: Partial<RecurrenceRow> & Pick<RecurrenceRow, "id" | "byDay">): RecurrenceRow {
  return {
    classroomId: "c1",
    recurrenceStartDate: "2026-11-01",
    startTime: "09:00:00",
    endTime: "10:00:00",
    ...partial,
  };
}

describe("truncate calendar helpers", () => {
  it("civilDateToByDay maps civil dates to RecurrenceByDay", () => {
    // 2026-11-14 = Saturday
    expect(civilDateToByDay("2026-11-14")).toBe("SATURDAY");
    expect(civilDateToByDay("2026-11-05")).toBe("THURSDAY");
  });

  it("matches weekly weekday on/after series start", () => {
    // 2026-11-05 = Thursday; 2026-11-04 = Wednesday
    expect(isRecurrenceOccurrence("2026-11-05", "THURSDAY", "2026-11-05")).toBe(true);
    expect(isRecurrenceOccurrence("2026-11-12", "THURSDAY", "2026-11-05")).toBe(true);
    expect(isRecurrenceOccurrence("2026-11-04", "THURSDAY", "2026-11-05")).toBe(false);
    expect(isRecurrenceOccurrence("2026-11-06", "THURSDAY", "2026-11-05")).toBe(false);
  });

  it("cutoff forward is inclusive", () => {
    expect(isCutoffForward("2026-11-26", "2026-11-26")).toBe(true);
    expect(isCutoffForward("2026-11-27", "2026-11-26")).toBe(true);
    expect(isCutoffForward("2026-11-25", "2026-11-26")).toBe(false);
  });

  it("cancelled = recurrence day on/after cutoff", () => {
    expect(isCancelledOccurrence("2026-11-26", "THURSDAY", "2026-11-05", "2026-11-26")).toBe(
      true,
    );
    expect(isCancelledOccurrence("2026-11-19", "THURSDAY", "2026-11-05", "2026-11-26")).toBe(
      false,
    );
    expect(isCancelledOccurrence("2026-11-27", "THURSDAY", "2026-11-05", "2026-11-26")).toBe(
      false,
    );
  });

  it("matchSessionRecurrence picks weekday + clock", () => {
    // 2026-11-05 = Thursday
    const matched = matchSessionRecurrence(
      { sessionDate: "2026-11-05", startTime: "09:00:00", endTime: "10:00:00" },
      [
        row({ id: "r1", byDay: "THURSDAY" }),
        row({ id: "r2", byDay: "MONDAY" }),
        row({ id: "r3", byDay: "THURSDAY", startTime: "11:00:00", endTime: "12:00:00" }),
      ],
    );
    expect(matched?.id).toBe("r1");
  });

  it("matchSessionRecurrence uses name when weekday+clock collide", () => {
    const matched = matchSessionRecurrence(
      {
        sessionDate: "2026-11-05",
        startTime: "09:00:00",
        endTime: "10:00:00",
        name: "B",
      },
      [
        row({ id: "r1", byDay: "THURSDAY", name: "A" }),
        row({ id: "r2", byDay: "THURSDAY", name: "B" }),
      ],
    );
    expect(matched?.id).toBe("r2");
  });

  it("matchSessionRecurrence returns undefined when ambiguous without name", () => {
    expect(
      matchSessionRecurrence(
        { sessionDate: "2026-11-05", startTime: "09:00:00", endTime: "10:00:00" },
        [
          row({ id: "r1", byDay: "THURSDAY", name: "A" }),
          row({ id: "r2", byDay: "THURSDAY", name: "B" }),
        ],
      ),
    ).toBeUndefined();
  });
});
