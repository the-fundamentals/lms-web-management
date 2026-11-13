import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionCalendar } from "./session-calendar";

const listSessions = vi.hoisted(() => vi.fn());
const cancelSession = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
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
  };
});

function renderCalendar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SessionCalendar classroomId="c1" />
    </QueryClientProvider>,
  );
}

describe("session calendar", () => {
  beforeEach(() => {
    listSessions.mockReset();
    cancelSession.mockReset();
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
    renderCalendar();
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
    expect(screen.getByTestId("session-peek-attendance-s1").textContent).toMatch(
      /Take attendance/i,
    );
    expect(screen.getByTestId("session-peek-cancel-s1")).toBeTruthy();
    fireEvent.click(screen.getByTestId("session-peek-attendance-s1"));
    expect(navigate).toHaveBeenCalledWith({
      to: "/classrooms/$classroomId/sessions/$sessionId",
      params: { classroomId: "c1", sessionId: "s1" },
    });
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
    renderCalendar();
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
    await waitFor(() => expect(screen.getByTestId("session-peek-cancel-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-peek-cancel-s1"));
    await waitFor(() => expect(screen.getByTestId("session-peek-cancel-dialog-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-peek-cancel-confirm"));
    await waitFor(() => expect(cancelSession).toHaveBeenCalledWith("c1", "s1"));
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
