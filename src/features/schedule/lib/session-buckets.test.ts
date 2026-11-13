import { describe, expect, it } from "vitest";
import {
  classifySession,
  compareSessionStart,
  filterSessionsByStatus,
  overviewBuckets,
  sessionChipClass,
  sessionStatusLabel,
} from "./session-buckets";
import { sessionStartInstant } from "./session-time";

function row(
  partial: Partial<{
    id: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    status: "OPEN" | "COMPLETED" | "CANCELLED";
  }> & { id: string },
) {
  return {
    sessionDate: "2026-07-19",
    startTime: "09:00:00",
    endTime: "10:00:00",
    status: "OPEN" as const,
    ...partial,
  };
}

describe("session buckets", () => {
  it("sorts by start then id", () => {
    const a = row({ id: "b", startTime: "09:00:00" });
    const b = row({ id: "a", startTime: "09:00:00" });
    const c = row({ id: "c", startTime: "08:00:00" });
    expect([a, b, c].sort(compareSessionStart).map((s) => s.id)).toEqual(["c", "a", "b"]);
  });

  it("classifies upcoming / active / past for OPEN; completed is past", () => {
    const start = Date.parse(sessionStartInstant("2026-07-19", "09:00:00"));
    expect(classifySession(row({ id: "1" }), start - 60_000)).toBe("upcoming");
    expect(classifySession(row({ id: "1" }), start + 60_000)).toBe("active");
    expect(classifySession(row({ id: "1" }), start + 3 * 60 * 60_000)).toBe("past");
    expect(classifySession(row({ id: "1", status: "COMPLETED" }), start - 60_000)).toBe("past");
  });

  it("overview caps at 10 preferring active then upcoming then past", () => {
    const now = Date.parse(sessionStartInstant("2026-07-19", "09:30:00"));
    const sessions = [
      row({ id: "active", startTime: "09:00:00", endTime: "11:00:00" }),
      ...Array.from({ length: 8 }, (_, i) =>
        row({
          id: `u${i}`,
          sessionDate: "2026-07-20",
          startTime: `${String(8 + i).padStart(2, "0")}:00:00`,
        }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        row({
          id: `p${i}`,
          sessionDate: "2026-07-18",
          status: "COMPLETED",
        }),
      ),
    ];
    const buckets = overviewBuckets(sessions, now, 10);
    expect(buckets.active.map((s) => s.id)).toEqual(["active"]);
    expect(buckets.upcoming).toHaveLength(8);
    expect(buckets.past).toHaveLength(1);
    expect(
      buckets.active.length + buckets.upcoming.length + buckets.past.length,
    ).toBe(10);
  });

  it("upcoming only includes the current GMT+7 month", () => {
    const now = Date.parse(sessionStartInstant("2026-07-19", "08:00:00"));
    const buckets = overviewBuckets(
      [
        row({ id: "this-month", sessionDate: "2026-07-25", startTime: "10:00:00" }),
        row({ id: "next-month", sessionDate: "2026-08-01", startTime: "10:00:00" }),
      ],
      now,
      10,
    );
    expect(buckets.upcoming.map((s) => s.id)).toEqual(["this-month"]);
  });

  it("session chip classes encode status", () => {
    expect(sessionStatusLabel("CANCELLED")).toBe("Cancelled");
    expect(sessionChipClass("CANCELLED", "SCHEDULE")).toMatch(/line-through/);
    expect(sessionChipClass("COMPLETED", "ADHOC")).toMatch(/emerald/);
    expect(
      filterSessionsByStatus(
        [
          row({ id: "1", status: "OPEN" }),
          row({ id: "2", status: "COMPLETED" }),
          row({ id: "3", status: "CANCELLED" }),
        ],
        { OPEN: true, COMPLETED: false, CANCELLED: true },
      ).map((s) => s.id),
    ).toEqual(["1", "3"]);
    expect(sessionChipClass("OPEN", "ADHOC")).toMatch(/primary/);
  });
});
