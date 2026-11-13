import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionAttendance } from "./session-attendance";

const fetchSession = vi.hoisted(() => vi.fn());
const listAttendances = vi.hoisted(() => vi.fn());
const listMembers = vi.hoisted(() => vi.fn());
const saveAttendanceStatuses = vi.hoisted(() => vi.fn());
const completeSession = vi.hoisted(() => vi.fn());

vi.mock("../lib/session-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/session-api")>("../lib/session-api");
  return {
    ...actual,
    sessionQueryOptions: (classroomId: string, sessionId: string) => ({
      queryKey: ["session", classroomId, sessionId],
      queryFn: () => fetchSession(classroomId, sessionId),
    }),
    sessionAttendancesQueryOptions: (classroomId: string, sessionId: string) => ({
      queryKey: ["att", classroomId, sessionId],
      queryFn: () => listAttendances(classroomId, sessionId),
    }),
    listActiveMembersForAttendance: (...args: unknown[]) => listMembers(...args),
    saveAttendanceStatuses: (...args: unknown[]) => saveAttendanceStatuses(...args),
    completeSession: (...args: unknown[]) => completeSession(...args),
    cancelSession: vi.fn(),
  };
});

function renderAttendance() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SessionAttendance classroomId="c1" sessionId="s1" />
    </QueryClientProvider>,
  );
}

const openSession = {
  id: "s1",
  classroomId: "c1",
  sessionDate: "2026-07-19",
  startTime: "09:00:00",
  endTime: "10:00:00",
  status: "OPEN" as const,
  type: "ADHOC" as const,
  name: "Morning",
};

describe("session attendance", () => {
  beforeEach(() => {
    fetchSession.mockReset();
    listAttendances.mockReset();
    listMembers.mockReset();
    saveAttendanceStatuses.mockReset();
    completeSession.mockReset();
  });
  afterEach(() => cleanup());

  it("marks Present after unlocking edit, then saves status only", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
    ]);
    saveAttendanceStatuses.mockResolvedValue([]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("attendance-edit")).toBeTruthy());
    fireEvent.click(screen.getByTestId("attendance-edit"));
    await waitFor(() => expect(screen.getByTestId("attendance-present-m1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("attendance-present-m1"));
    fireEvent.click(screen.getByTestId("attendance-save"));
    await waitFor(() => expect(saveAttendanceStatuses).toHaveBeenCalled());
    expect(saveAttendanceStatuses.mock.calls[0]![2]).toEqual([
      { classroomMemberId: "m1", status: "ATTENDED" },
    ]);
  });

  it("locks edit when not open and shows status banner", async () => {
    fetchSession.mockResolvedValue({ ...openSession, status: "COMPLETED" });
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
    ]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-not-open")).toBeTruthy());
    expect(screen.queryByTestId("attendance-edit")).toBeNull();
    expect(screen.queryByTestId("session-complete")).toBeNull();
    expect(screen.getByTestId("session-details").textContent).toMatch(/locked/i);
    expect(screen.queryByTestId("session-status-banner")).toBeNull();
  });

  it("complete confirmation names the session", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([]);
    completeSession.mockResolvedValue({ ...openSession, status: "COMPLETED" });
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-complete")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-complete"));
    await waitFor(() => expect(screen.getByTestId("session-lifecycle-dialog")).toBeTruthy());
    expect(screen.getByTestId("session-lifecycle-dialog").textContent).toMatch(/Morning/i);
    expect(screen.queryByTestId("session-complete-attendance-warning")).toBeNull();
  });

  it("complete warns when students have no attendance", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
      { id: "m2", accountId: "a2", name: "Bob", email: "b@x.com", status: "ACTIVE" },
    ]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-complete")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-complete"));
    await waitFor(() =>
      expect(screen.getByTestId("session-complete-attendance-warning")).toBeTruthy(),
    );
    expect(screen.getByTestId("session-complete-attendance-warning").textContent).toMatch(
      /2 students/i,
    );
    expect(screen.getByTestId("session-complete-attendance-warning").textContent).toMatch(
      /Are you sure you want to continue/i,
    );
  });

  it("marks Absent after unlock with status only", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
    ]);
    saveAttendanceStatuses.mockResolvedValue([]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("attendance-edit")).toBeTruthy());
    fireEvent.click(screen.getByTestId("attendance-edit"));
    fireEvent.click(screen.getByTestId("attendance-absent-m1"));
    fireEvent.click(screen.getByTestId("attendance-save"));
    await waitFor(() => expect(saveAttendanceStatuses).toHaveBeenCalled());
    expect(saveAttendanceStatuses.mock.calls[0]![2]).toEqual([
      { classroomMemberId: "m1", status: "ABSENT" },
    ]);
  });

  it("session details lists when, type, and timezone", async () => {
    fetchSession.mockResolvedValue({
      ...openSession,
      name: "Morning",
      description: "Warm-up set",
    });
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-details")).toBeTruthy());
    const details = screen.getByTestId("session-details").textContent ?? "";
    expect(details).toMatch(/When/i);
    expect(details).toMatch(/Type/i);
    expect(details).toMatch(/Adhoc|Schedule/i);
    expect(details).toMatch(/GMT\+7/);
    expect(details).toMatch(/Morning/);
    expect(details).toMatch(/Warm-up set/);
  });
});
