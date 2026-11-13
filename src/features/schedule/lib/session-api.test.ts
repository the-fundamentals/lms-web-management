import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attendanceStatusBody,
  createRecurrenceBody,
  createSessionBody,
  defaultSessionListFilter,
  sessionListFilter,
} from "./session-api";

vi.mock("@/generated/sdk.gen", () => ({
  cancelClassroomSession: vi.fn(),
  completeClassroomSession: vi.fn(),
  createClassroomScheduleRecurrence: vi.fn(),
  createClassroomSession: vi.fn(),
  createClassroomSessionAttendances: vi.fn(),
  deleteClassroomScheduleRecurrence: vi.fn(),
  getAllClassroomMembers: vi.fn(),
  getAllClassroomScheduleRecurrences: vi.fn(),
  getAllClassroomSessionAttendances: vi.fn(),
  getAllClassroomSessions: vi.fn(),
  getClassroomSessionById: vi.fn(),
  updateClassroomSessionAttendance: vi.fn(),
}));

vi.mock("@/shared/api/query-client", () => ({
  queryClient: { invalidateQueries: vi.fn(async () => undefined) },
}));

describe("session api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create session body uses civil date and HH:MM:SS", () => {
    expect(
      createSessionBody({
        sessionDate: "2026-07-19",
        startTime: "09:00",
        endTime: "10:30",
        name: " Intro ",
      }),
    ).toEqual({
      sessionDate: "2026-07-19",
      startTime: "09:00:00",
      endTime: "10:30:00",
      name: "Intro",
    });
  });

  it("recurrence body is WEEKLY with byDays", () => {
    expect(
      createRecurrenceBody({
        byDays: ["MONDAY", "WEDNESDAY"],
        recurrenceStartDate: "2026-07-01",
        startTime: "09:00:00",
        endTime: "10:00:00",
      }),
    ).toEqual({
      frequency: "WEEKLY",
      byDays: ["MONDAY", "WEDNESDAY"],
      recurrenceStartDate: "2026-07-01",
      startTime: "09:00:00",
      endTime: "10:00:00",
    });
  });

  it("attendance body is status only", () => {
    expect(attendanceStatusBody("ATTENDED")).toEqual({ status: "ATTENDED" });
    expect(attendanceStatusBody("ABSENT")).toEqual({ status: "ABSENT" });
  });

  it("session list filter size is at most 50", () => {
    expect(defaultSessionListFilter.size).toBe(50);
    expect(defaultSessionListFilter.page).toBe(0);
  });

  it("sessionListFilter adds inclusive sessionDate gte/lte", () => {
    expect(sessionListFilter({ from: "2026-11-01", to: "2026-11-30" })).toEqual({
      page: 0,
      size: 50,
      sortBy: "startTime",
      sortDirection: "ASC",
      filters: [
        { field: "sessionDate", operator: "gte", value: "2026-11-01" },
        { field: "sessionDate", operator: "lte", value: "2026-11-30" },
      ],
    });
  });
});

describe("listSessions range", () => {
  it("posts sessionDate filters and drops rows outside the window", async () => {
    const { getAllClassroomSessions } = await import("@/generated/sdk.gen");
    const { listSessions } = await import("./session-api");
    vi.mocked(getAllClassroomSessions).mockResolvedValue({
      data: [
        {
          id: "in",
          classroomId: "c1",
          sessionDate: "2026-11-15",
          startTime: "09:00:00",
          endTime: "10:00:00",
          status: "OPEN",
          type: "ADHOC",
        },
        {
          id: "out",
          classroomId: "c1",
          sessionDate: "2026-12-01",
          startTime: "09:00:00",
          endTime: "10:00:00",
          status: "OPEN",
          type: "ADHOC",
        },
      ],
    } as never);

    const rows = await listSessions("c1", { from: "2026-11-01", to: "2026-11-30" });
    expect(getAllClassroomSessions).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { classroomId: "c1" },
        body: expect.objectContaining({
          filters: [
            { field: "sessionDate", operator: "gte", value: "2026-11-01" },
            { field: "sessionDate", operator: "lte", value: "2026-11-30" },
          ],
        }),
      }),
    );
    expect(rows.map((r) => r.id)).toEqual(["in"]);
  });
});
