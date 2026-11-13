import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionAttendanceSheet } from "./session-attendance-sheet";

const fetchSession = vi.hoisted(() => vi.fn());
const cancelSession = vi.hoisted(() => vi.fn());
const listAttendances = vi.hoisted(() => vi.fn());
const listMembers = vi.hoisted(() => vi.fn());

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
    cancelSession: (...args: unknown[]) => cancelSession(...args),
    completeSession: vi.fn(),
    saveAttendanceStatuses: vi.fn(),
  };
});

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

describe("session attendance sheet", () => {
  beforeEach(() => {
    fetchSession.mockReset();
    cancelSession.mockReset();
    listAttendances.mockReset();
    listMembers.mockReset();
  });
  afterEach(() => cleanup());

  it("puts Cancel session in the header ⋯ menu next to close", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <SessionAttendanceSheet
          classroomId="c1"
          onOpenChange={() => undefined}
          open
          sessionId="s1"
        />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("session-actions-menu")).toBeTruthy());
    expect(screen.getByTestId("session-attendance-close")).toBeTruthy();
    fireEvent.pointerDown(screen.getByTestId("session-actions-menu"));
    await waitFor(() => expect(screen.getByTestId("session-cancel")).toBeTruthy());
    expect(screen.getByTestId("session-cancel").textContent).toMatch(/Cancel session/i);
    fireEvent.click(screen.getByTestId("session-cancel"));
    await waitFor(() => expect(screen.getByTestId("session-lifecycle-dialog")).toBeTruthy());
    expect(screen.getByTestId("session-lifecycle-dialog").textContent).toMatch(/Morning/i);
  });

  it("hides the ⋯ menu when the session is not open", async () => {
    fetchSession.mockResolvedValue({ ...openSession, status: "COMPLETED" });
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <SessionAttendanceSheet
          classroomId="c1"
          onOpenChange={() => undefined}
          open
          sessionId="s1"
        />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("session-attendance-sheet")).toBeTruthy());
    expect(screen.queryByTestId("session-actions-menu")).toBeNull();
    expect(screen.getByTestId("session-attendance-close")).toBeTruthy();
  });

  it("title uses session name only; subtitle shows type and status", async () => {
    fetchSession.mockResolvedValue({
      ...openSession,
      name: "Make-up Lesson for 13/11/2026",
      sessionDate: "2026-11-18",
    });
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <SessionAttendanceSheet
          classroomId="c1"
          onOpenChange={() => undefined}
          open
          sessionId="s1"
        />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("session-status-banner")).toBeTruthy());
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Make-up Lesson for 13/11/2026",
    );
    expect(screen.getByTestId("session-header-meta").textContent).toMatch(/Adhoc/i);
    expect(screen.getByTestId("session-status-banner").textContent).toMatch(/Open/i);
  });
});
