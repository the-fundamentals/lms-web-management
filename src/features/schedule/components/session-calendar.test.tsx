import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SESSION_STATUS_FILTER,
  type SessionStatusFilter,
} from "../lib/session-buckets";
import { civilDateToByDay } from "../lib/truncate-calendar";
import { SessionCalendar } from "./session-calendar";

const listSessions = vi.hoisted(() => vi.fn());
const listRecurrences = vi.hoisted(() => vi.fn());
const listSessionAttendances = vi.hoisted(() => vi.fn());
const listClassroomMembers = vi.hoisted(() => vi.fn());
const cancelSession = vi.hoisted(() => vi.fn());
const deleteRecurrence = vi.hoisted(() => vi.fn());
const updateSession = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

const WITH_CANCELLED: SessionStatusFilter = {
  ...DEFAULT_SESSION_STATUS_FILTER,
  CANCELLED: true,
};

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
}));

vi.mock("@/shared/api/classroom-members", () => ({
  classroomMembersQueryOptions: (classroomId: string) => ({
    queryKey: ["classroom-members", classroomId],
    queryFn: () => listClassroomMembers(classroomId),
  }),
}));

vi.mock("../lib/session-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/session-api")>("../lib/session-api");
  return {
    ...actual,
    sessionsQueryOptions: (
      classroomId: string,
      range?: { from: string; to: string },
    ) => ({
      queryKey: ["cal", classroomId, range?.from ?? "", range?.to ?? ""],
      queryFn: () => listSessions(classroomId, range),
    }),
    cancelSession: (...args: unknown[]) => cancelSession(...args),
    deleteRecurrence: (...args: unknown[]) => deleteRecurrence(...args),
    updateSession: (...args: unknown[]) => updateSession(...args),
    recurrencesQueryOptions: (classroomId: string) => ({
      queryKey: ["cal-rec", classroomId],
      queryFn: () => listRecurrences(classroomId),
    }),
    sessionAttendancesQueryOptions: (classroomId: string, sessionId: string) => ({
      queryKey: ["cal", classroomId, sessionId, "attendances"],
      queryFn: () => listSessionAttendances(classroomId, sessionId),
    }),
  };
});

function renderCalendar(statusFilter?: SessionStatusFilter) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SessionCalendar classroomId="c1" statusFilter={statusFilter} />
    </QueryClientProvider>,
  );
}

describe("session calendar", () => {
  beforeEach(() => {
    listSessions.mockReset();
    listRecurrences.mockReset();
    listRecurrences.mockResolvedValue([]);
    listSessionAttendances.mockReset();
    listSessionAttendances.mockResolvedValue([]);
    listClassroomMembers.mockReset();
    listClassroomMembers.mockResolvedValue([]);
    cancelSession.mockReset();
    deleteRecurrence.mockReset();
    updateSession.mockReset();
    navigate.mockReset();
  });
  afterEach(() => cleanup());

  it("renders grid and month label", async () => {
    listSessions.mockResolvedValue([]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-grid")).toBeTruthy());
    expect(screen.getByTestId("calendar-month-label").textContent).toMatch(/\d{4}/);
  });

  it("prev month changes the label", async () => {
    listSessions.mockResolvedValue([]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-prev")).toBeTruthy());
    const before = screen.getByTestId("calendar-month-label").textContent;
    fireEvent.click(screen.getByTestId("calendar-prev"));
    expect(screen.getByTestId("calendar-month-label").textContent).not.toBe(before);
  });

  it("shows session start time when present for the month", async () => {
    // Use today's civil GMT+7 date so the fixture lands in the initial month.
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "OPEN",
        type: "ADHOC",
        name: "Morning",
      },
      {
        id: "s2",
        classroomId: "c1",
        sessionDate: date,
        startTime: "11:00:00",
        endTime: "12:00:00",
        status: "CANCELLED",
        type: "SCHEDULE",
      },
    ]);
    renderCalendar(WITH_CANCELLED);
    await waitFor(() => expect(screen.getByTestId(`calendar-cell-${date}`)).toBeTruthy());
    expect(screen.getByTestId(`calendar-cell-${date}`).textContent).toContain("09:00");
    expect(screen.getByTestId("calendar-session-s2").getAttribute("data-status")).toBe(
      "CANCELLED",
    );
  });

  it("session chip peek: open shows take attendance + cancel", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "OPEN",
        type: "ADHOC",
        name: "Morning",
      },
    ]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-session-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("calendar-session-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-s1")).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId("session-peek-attendance-summary").textContent).toMatch(
        /0\s*Attended/i,
      ),
    );
    expect(screen.getByTestId("session-peek-attendance-s1").textContent).toMatch(
      /Take attendance/i,
    );
    // Radix DropdownMenu opens on pointerdown in jsdom.
    fireEvent.pointerDown(screen.getByTestId("session-peek-more-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-menu-s1")).toBeTruthy());
    expect(screen.getByTestId("session-peek-edit-s1")).toBeTruthy();
    expect(screen.getByTestId("session-peek-cancel-s1")).toBeTruthy();
    fireEvent.click(screen.getByTestId("session-peek-attendance-s1"));
    expect(navigate).toHaveBeenCalledWith({
      to: "/classrooms/$classroomId/sessions/$sessionId",
      params: { classroomId: "c1", sessionId: "s1" },
    });
  });

  it("session chip peek: shows attended / absent / unknown counts", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "21:00:00",
        endTime: "22:30:00",
        status: "COMPLETED",
        type: "SCHEDULE",
      },
    ]);
    listClassroomMembers.mockResolvedValue([
      { id: "m1", classroomId: "c1", accountId: "a1", role: "STUDENT", status: "ACTIVE", email: "a@x", name: "A" },
      { id: "m2", classroomId: "c1", accountId: "a2", role: "STUDENT", status: "ACTIVE", email: "b@x", name: "B" },
      { id: "m3", classroomId: "c1", accountId: "a3", role: "STUDENT", status: "ACTIVE", email: "c@x", name: "C" },
      { id: "m4", classroomId: "c1", accountId: "a4", role: "STUDENT", status: "INACTIVE", email: "d@x", name: "D" },
    ]);
    listSessionAttendances.mockResolvedValue([
      { id: "att1", classroomMemberId: "m1", status: "ATTENDED" },
      { id: "att2", classroomMemberId: "m2", status: "ABSENT" },
    ]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-session-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("calendar-session-s1"));
    await waitFor(() => {
      const text = screen.getByTestId("session-peek-attendance-summary").textContent ?? "";
      expect(text).toMatch(/1\s*Attended/i);
      expect(text).toMatch(/1\s*Absent/i);
      expect(text).toMatch(/1\s*Unknown/i);
    });
  });

  it("session chip peek: edit ADHOC posts updateSession", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "OPEN",
        type: "ADHOC",
        name: "Morning",
      },
    ]);
    updateSession.mockResolvedValue({
      id: "s1",
      classroomId: "c1",
      sessionDate: date,
      startTime: "10:00:00",
      endTime: "11:00:00",
      status: "OPEN",
      type: "ADHOC",
      name: "Updated",
    });
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-session-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("calendar-session-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-more-s1")).toBeTruthy());
    fireEvent.pointerDown(screen.getByTestId("session-peek-more-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-edit-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-peek-edit-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-edit-form-s1")).toBeTruthy());
    fireEvent.change(screen.getByTestId("session-peek-start-s1"), {
      target: { value: "10:00" },
    });
    fireEvent.change(screen.getByTestId("session-peek-end-s1"), {
      target: { value: "11:00" },
    });
    fireEvent.change(screen.getByTestId("session-peek-name-s1"), {
      target: { value: "Updated" },
    });
    fireEvent.click(screen.getByTestId("session-peek-edit-save-s1"));
    await waitFor(() =>
      expect(updateSession).toHaveBeenCalledWith(
        "c1",
        "s1",
        expect.objectContaining({
          sessionDate: date,
          startTime: "10:00",
          endTime: "11:00",
          name: "Updated",
        }),
      ),
    );
  });

  it("session chip peek: SCHEDULE open has no edit", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "OPEN",
        type: "SCHEDULE",
        name: "Weekly",
      },
    ]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-session-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("calendar-session-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-more-s1")).toBeTruthy());
    fireEvent.pointerDown(screen.getByTestId("session-peek-more-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-menu-s1")).toBeTruthy());
    expect(screen.queryByTestId("session-peek-edit-s1")).toBeNull();
    expect(screen.getByTestId("session-peek-cancel-s1")).toBeTruthy();
  });

  it("session chip peek: completed shows view attendance only", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "COMPLETED",
        type: "ADHOC",
        name: "Morning",
      },
    ]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-session-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("calendar-session-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-attendance-s1")).toBeTruthy());
    expect(screen.getByTestId("session-peek-attendance-s1").textContent).toMatch(
      /View attendance/i,
    );
    expect(screen.queryByTestId("session-peek-cancel-s1")).toBeNull();
  });

  it("session chip peek: cancelled has no actions", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "CANCELLED",
        type: "ADHOC",
        name: "Morning",
      },
    ]);
    renderCalendar(WITH_CANCELLED);
    await waitFor(() => expect(screen.getByTestId("calendar-session-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("calendar-session-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-s1")).toBeTruthy());
    expect(screen.queryByTestId("session-peek-attendance-s1")).toBeNull();
    expect(screen.queryByTestId("session-peek-cancel-s1")).toBeNull();
  });

  it("status filter hides cancelled chips from the grid", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "OPEN",
        type: "ADHOC",
      },
      {
        id: "s2",
        classroomId: "c1",
        sessionDate: date,
        startTime: "11:00:00",
        endTime: "12:00:00",
        status: "CANCELLED",
        type: "SCHEDULE",
      },
    ]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <SessionCalendar
          classroomId="c1"
          statusFilter={{ OPEN: true, COMPLETED: true, CANCELLED: false }}
        />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("calendar-session-s1")).toBeTruthy());
    expect(screen.queryByTestId("calendar-session-s2")).toBeNull();
  });

  it("session chip peek: cancel lesson confirms then cancels", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "OPEN",
        type: "ADHOC",
        name: "Morning",
      },
    ]);
    cancelSession.mockResolvedValue({
      id: "s1",
      classroomId: "c1",
      sessionDate: date,
      startTime: "09:00:00",
      endTime: "10:00:00",
      status: "CANCELLED",
      type: "ADHOC",
      name: "Morning",
    });
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-session-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("calendar-session-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-more-s1")).toBeTruthy());
    // Radix DropdownMenu opens on pointerdown in jsdom.
    fireEvent.pointerDown(screen.getByTestId("session-peek-more-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-menu-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-peek-cancel-s1"));
    await waitFor(() => expect(screen.getByTestId("session-cancel-dialog-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-cancel-confirm"));
    await waitFor(() => expect(cancelSession).toHaveBeenCalledWith("c1", "s1"));
    expect(deleteRecurrence).not.toHaveBeenCalled();
  });

  it("session chip peek: SCHEDULE series cancel truncates recurrence", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "OPEN",
        type: "SCHEDULE",
        name: "Weekly",
      },
    ]);
    listRecurrences.mockResolvedValue([
      {
        id: "r1",
        classroomId: "c1",
        byDay: civilDateToByDay(date),
        recurrenceStartDate: "2026-01-01",
        startTime: "09:00:00",
        endTime: "10:00:00",
        name: "Weekly",
      },
    ]);
    deleteRecurrence.mockResolvedValue(undefined);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-session-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("calendar-session-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-more-s1")).toBeTruthy());
    fireEvent.pointerDown(screen.getByTestId("session-peek-more-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-cancel-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-peek-cancel-s1"));
    await waitFor(() => expect(screen.getByTestId("session-cancel-dialog-s1")).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId("session-cancel-series-s1").textContent).toMatch(
        /Ends the weekly pattern/i,
      ),
    );
    fireEvent.click(screen.getByTestId("session-cancel-series-s1"));
    fireEvent.click(screen.getByTestId("session-cancel-confirm"));
    await waitFor(() => expect(deleteRecurrence).toHaveBeenCalledWith("c1", "r1", date));
    expect(cancelSession).not.toHaveBeenCalled();
  });

  it("date number opens 24h day sheet with sessions", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "17:00:00",
        endTime: "18:00:00",
        status: "OPEN",
        type: "SCHEDULE",
      },
    ]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId(`calendar-day-${date}`)).toBeTruthy());
    fireEvent.click(screen.getByTestId(`calendar-day-${date}`));
    await waitFor(() => expect(screen.getByTestId("session-day-sheet")).toBeTruthy());
    expect(screen.getByTestId("day-sheet-timeline")).toBeTruthy();
    expect(screen.getByTestId("day-sheet-session-s1")).toBeTruthy();
  });

  it("next month changes the label", async () => {
    listSessions.mockResolvedValue([]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-next")).toBeTruthy());
    const before = screen.getByTestId("calendar-month-label").textContent;
    fireEvent.click(screen.getByTestId("calendar-next"));
    expect(screen.getByTestId("calendar-month-label").textContent).not.toBe(before);
  });

  it("next month disables at the 3-month horizon", async () => {
    listSessions.mockResolvedValue([]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-next")).toBeTruthy());
    // Current + 3 months is the cap.
    fireEvent.click(screen.getByTestId("calendar-next"));
    fireEvent.click(screen.getByTestId("calendar-next"));
    fireEvent.click(screen.getByTestId("calendar-next"));
    expect(screen.getByTestId("calendar-next").hasAttribute("disabled")).toBe(true);
    const atCap = screen.getByTestId("calendar-month-label").textContent;
    fireEvent.click(screen.getByTestId("calendar-next"));
    expect(screen.getByTestId("calendar-month-label").textContent).toBe(atCap);
  });

  it("back link is present", async () => {
    listSessions.mockResolvedValue([]);
    renderCalendar();
    await waitFor(() => expect(screen.getByTestId("calendar-back")).toBeTruthy());
  });
});
