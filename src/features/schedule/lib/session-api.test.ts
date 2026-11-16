import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attendanceStatusBody,
  createRecurrenceBody,
  createSessionBody,
  defaultSessionListFilter,
  deleteRecurrence,
  deleteRecurrenceBody,
  sessionListFilter,
  updateSession,
  updateSessionBody,
} from "./session-api";
import {
  deleteClassroomScheduleRecurrence,
  updateClassroomSession,
} from "@/generated/sdk.gen";

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
  updateClassroomSession: vi.fn(),
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

  it("delete recurrence body requires cutoffDate", () => {
    expect(deleteRecurrenceBody("2026-11-14")).toEqual({ cutoffDate: "2026-11-14" });
  });

  it("deleteRecurrence posts cutoffDate and invalidates", async () => {
    vi.mocked(deleteClassroomScheduleRecurrence).mockResolvedValue({
      data: undefined,
      request: new Request("http://local"),
      response: new Response(),
    } as never);
    await deleteRecurrence("c1", "r1", "2026-11-14");
    expect(deleteClassroomScheduleRecurrence).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { classroomId: "c1", scheduleId: "r1" },
        body: { cutoffDate: "2026-11-14" },
        throwOnError: true,
      }),
    );
  });

  it("attendance body is status only", () => {
    expect(attendanceStatusBody("ATTENDED")).toEqual({ status: "ATTENDED" });
    expect(attendanceStatusBody("ABSENT")).toEqual({ status: "ABSENT" });
  });

  it("update session body can change ADHOC date/time and name", () => {
    expect(
      updateSessionBody({
        sessionDate: "2026-07-20",
        startTime: "10:00",
        endTime: "11:30",
        name: " Make-up ",
      }),
    ).toEqual({
      sessionDate: "2026-07-20",
      startTime: "10:00:00",
      endTime: "11:30:00",
      name: "Make-up",
    });
  });

  it("updateSession posts body and invalidates", async () => {
    vi.mocked(updateClassroomSession).mockResolvedValue({
      data: {
        id: "s1",
        classroomId: "c1",
        sessionDate: "2026-07-20",
        startTime: "10:00:00",
        endTime: "11:30:00",
        status: "OPEN",
        type: "ADHOC",
        name: "Make-up",
        createdDate: "2026-01-01T00:00:00Z",
        lastModifiedDate: "2026-01-01T00:00:00Z",
      },
      request: new Request("http://local"),
      response: new Response(),
    } as never);
    await updateSession("c1", "s1", {
      sessionDate: "2026-07-20",
      startTime: "10:00",
      endTime: "11:30",
      name: "Make-up",
    });
    expect(updateClassroomSession).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { classroomId: "c1", sessionId: "s1" },
        body: {
          sessionDate: "2026-07-20",
          startTime: "10:00:00",
          endTime: "11:30:00",
          name: "Make-up",
        },
        throwOnError: true,
      }),
    );
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
