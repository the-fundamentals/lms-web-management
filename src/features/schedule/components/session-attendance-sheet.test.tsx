import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionAttendanceSheet } from "./session-attendance-sheet";

const fetchSession = vi.hoisted(() => vi.fn());
const cancelSession = vi.hoisted(() => vi.fn());
const listAttendances = vi.hoisted(() => vi.fn());
const listMembers = vi.hoisted(() => vi.fn());
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
    cancelSession: (...args: unknown[]) => cancelSession(...args),
    updateSession: (...args: unknown[]) => updateSession(...args),
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
    updateSession.mockReset();
  });
  afterEach(() => cleanup());

  it("puts Cancel session in a ⋯ menu next to Complete", async () => {
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
    expect(screen.getByTestId("session-complete")).toBeTruthy();
    expect(screen.getByTestId("session-attendance-close")).toBeTruthy();
    fireEvent.pointerDown(screen.getByTestId("session-actions-menu"));
    await waitFor(() => expect(screen.getByTestId("session-cancel")).toBeTruthy());
    expect(screen.getByTestId("session-cancel").textContent).toMatch(/Cancel session/i);
    fireEvent.click(screen.getByTestId("session-cancel"));
    await waitFor(() => expect(screen.getByTestId("session-cancel-dialog-s1")).toBeTruthy());
    expect(screen.getByTestId("session-cancel-dialog-s1").textContent).toMatch(/Morning/i);
    expect(screen.getByTestId("session-cancel-dialog-s1").textContent).toMatch(
      /Cancel this session/i,
    );
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
    expect(screen.queryByTestId("session-complete")).toBeNull();
    expect(screen.getByTestId("session-attendance-close")).toBeTruthy();
  });

  it("header holds name + when / type / status; left column is notes", async () => {
    fetchSession.mockResolvedValue({
      ...openSession,
      name: "Make-up Lesson for 13/11/2026",
      sessionDate: "2026-11-18",
      startTime: "21:00:00",
      endTime: "22:30:00",
      description: "Bring worksheets",
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
    const meta = screen.getByTestId("session-header-meta").textContent ?? "";
    expect(meta).toMatch(/Adhoc/i);
    expect(meta).toMatch(/21:00/);
    expect(screen.getByTestId("session-status-banner").textContent).toMatch(/Open/i);
    expect(screen.getByTestId("session-edit-title")).toBeTruthy();
    expect(screen.getByTestId("session-details").textContent).not.toMatch(
      /Make-up Lesson/,
    );
    expect(screen.getByTestId("session-notes-display").textContent).toMatch(
      /Bring worksheets/,
    );
  });

  it("edits session name from the modal header", async () => {
    fetchSession.mockResolvedValue(openSession);
    listAttendances.mockResolvedValue([]);
    listMembers.mockResolvedValue([]);
    updateSession.mockResolvedValue({ ...openSession, name: "Renamed" });
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
    await waitFor(() => expect(screen.getByTestId("session-edit-title")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-edit-title"));
    fireEvent.change(screen.getByTestId("session-title-input"), {
      target: { value: "Renamed" },
    });
    fireEvent.click(screen.getByTestId("session-title-save"));
    await waitFor(() =>
      expect(updateSession).toHaveBeenCalledWith("c1", "s1", {
        name: "Renamed",
        description: null,
      }),
    );
  });
});
