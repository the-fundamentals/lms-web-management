import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionAttendance } from "./session-attendance";

const fetchSession = vi.hoisted(() => vi.fn());
const listAttendances = vi.hoisted(() => vi.fn());
const listMembers = vi.hoisted(() => vi.fn());
const saveAttendanceStatuses = vi.hoisted(() => vi.fn());
const completeSession = vi.hoisted(() => vi.fn());
const updateSession = vi.hoisted(() => vi.fn());

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
    updateSession: (...args: unknown[]) => updateSession(...args),
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
    updateSession.mockReset();
  });
  afterEach(() => cleanup());

  it("shows right roster with attendance summary in roster header", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([
      { id: "a1", sessionId: "s1", classroomMemberId: "m1", status: "ATTENDED" },
      { id: "a2", sessionId: "s1", classroomMemberId: "m2", status: "ABSENT" },
    ]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
      { id: "m2", accountId: "a2", name: "Bob", email: "b@x.com", status: "ACTIVE" },
    ]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("attendance-roster")).toBeTruthy());
    expect(screen.getByTestId("attendance-roster-panel")).toBeTruthy();
    expect(screen.queryByTestId("attendance-section")).toBeNull();
    expect(screen.getByTestId("attendance-summary").textContent).toMatch(/1 Present/i);
    expect(screen.getByTestId("attendance-summary").textContent).toMatch(/1 Absent/i);
    expect(screen.queryByTestId("attendance-edit")).toBeNull();
    expect(screen.queryByTestId("attendance-save")).toBeNull();
  });

  it("floats Save up after marking Present, then saves status only", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
    ]);
    saveAttendanceStatuses.mockResolvedValue([]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("attendance-present-m1")).toBeTruthy());
    expect(screen.queryByTestId("attendance-save")).toBeNull();
    fireEvent.click(screen.getByTestId("attendance-present-m1"));
    await waitFor(() => expect(screen.getByTestId("attendance-save")).toBeTruthy());
    fireEvent.click(screen.getByTestId("attendance-save"));
    await waitFor(() => expect(saveAttendanceStatuses).toHaveBeenCalled());
    expect(saveAttendanceStatuses.mock.calls[0]![2]).toEqual([
      { classroomMemberId: "m1", status: "ATTENDED" },
    ]);
  });

  it("locks edit when not open", async () => {
    fetchSession.mockResolvedValue({ ...openSession, status: "COMPLETED" });
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
    ]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-not-open")).toBeTruthy());
    expect(screen.queryByTestId("attendance-present-m1")).toBeNull();
    expect(screen.queryByTestId("session-complete")).toBeNull();
    expect(screen.queryByTestId("attendance-save")).toBeNull();
    expect(screen.getByTestId("session-details").textContent).toMatch(/locked/i);
  });

  it("complete confirmation names the session", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([]);
    completeSession.mockResolvedValue({ ...openSession, status: "COMPLETED" });
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-complete")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-complete"));
    await waitFor(() => expect(screen.getByTestId("session-complete-dialog")).toBeTruthy());
    expect(screen.getByTestId("session-complete-dialog").textContent).toMatch(/Morning/i);
    expect(screen.queryByTestId("session-complete-attendance-warning")).toBeNull();
  });

  it("disables complete until at least one attendance is saved", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
      { id: "m2", accountId: "a2", name: "Bob", email: "b@x.com", status: "ACTIVE" },
    ]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-complete")).toBeTruthy());
    expect(
      (screen.getByTestId("session-complete") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByTestId("session-complete-hint")).toBeTruthy();
  });

  it("enables complete after a saved attendance mark", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([
      { id: "a1", sessionId: "s1", classroomMemberId: "m1", status: "ATTENDED" },
    ]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
      { id: "m2", accountId: "a2", name: "Bob", email: "b@x.com", status: "ACTIVE" },
    ]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-complete")).toBeTruthy());
    expect(
      (screen.getByTestId("session-complete") as HTMLButtonElement).disabled,
    ).toBe(false);
    fireEvent.click(screen.getByTestId("session-complete"));
    await waitFor(() =>
      expect(screen.getByTestId("session-complete-attendance-warning")).toBeTruthy(),
    );
    expect(screen.getByTestId("session-complete-attendance-warning").textContent).toMatch(
      /1 student/i,
    );
  });

  it("marks Absent then saves", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([
      { id: "m1", accountId: "a1", name: "Ann", email: "a@x.com", status: "ACTIVE" },
    ]);
    saveAttendanceStatuses.mockResolvedValue([]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("attendance-absent-m1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("attendance-absent-m1"));
    fireEvent.click(screen.getByTestId("attendance-save"));
    await waitFor(() => expect(saveAttendanceStatuses).toHaveBeenCalled());
    expect(saveAttendanceStatuses.mock.calls[0]![2]).toEqual([
      { classroomMemberId: "m1", status: "ABSENT" },
    ]);
  });

  it("left column is notes only (facts live in the sheet header)", async () => {
    fetchSession.mockResolvedValue({
      ...openSession,
      name: "Morning",
      description: "Warm-up set",
    });
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-notes-block")).toBeTruthy());
    expect(screen.getByTestId("session-notes-display").textContent).toMatch(/Warm-up set/);
    expect(screen.queryByTestId("session-notes-input")).toBeNull();
    expect(screen.getByTestId("session-details").textContent).not.toMatch(/When/i);
    expect(screen.queryByTestId("session-edit-title")).toBeNull();
  });

  it("saves session notes to description on demand", async () => {
    fetchSession.mockResolvedValue({ ...openSession, description: "" });
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([]);
    updateSession.mockResolvedValue({
      ...openSession,
      description: "Bring worksheets",
    });
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("session-edit-notes")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-edit-notes"));
    fireEvent.change(screen.getByTestId("session-notes-input"), {
      target: { value: "Bring worksheets" },
    });
    fireEvent.click(screen.getByTestId("session-notes-save"));
    await waitFor(() =>
      expect(updateSession).toHaveBeenCalledWith("c1", "s1", {
        name: "Morning",
        description: "Bring worksheets",
      }),
    );
  });
});
