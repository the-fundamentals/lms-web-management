import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionAttendance } from "./session-attendance";
import { SessionCreate } from "./session-create";
import { SessionOverview } from "./session-overview";

const getAllClassroomSessions = vi.hoisted(() => vi.fn());
const createClassroomSession = vi.hoisted(() => vi.fn());
const getClassroomSessionById = vi.hoisted(() => vi.fn());
const getAllClassroomSessionAttendances = vi.hoisted(() => vi.fn());
const createClassroomSessionAttendances = vi.hoisted(() => vi.fn());
const updateClassroomSessionAttendance = vi.hoisted(() => vi.fn());
const getAllClassroomMembers = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    params,
    to,
    ...rest
  }: {
    children?: ReactNode;
    params?: { classroomId?: string; sessionId?: string };
    to: string;
  }) => {
    let href = to;
    if (to.includes("$sessionId")) {
      href = `/classrooms/${params?.classroomId}/sessions/${params?.sessionId}`;
    } else if (to.includes("calendar")) {
      href = `/classrooms/${params?.classroomId}/calendar`;
    } else if (to.includes("weekly")) {
      href = `/classrooms/${params?.classroomId}/weekly`;
    } else if (to.includes("sessions/new")) {
      href = `/classrooms/${params?.classroomId}/sessions/new`;
    } else if (params?.classroomId) {
      href = `/classrooms/${params.classroomId}`;
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
  useNavigate: () => navigate,
  useBlocker: vi.fn(),
}));

vi.mock("@/generated/sdk.gen", () => ({
  getAllClassroomSessions: (...args: unknown[]) => getAllClassroomSessions(...args),
  createClassroomSession: (...args: unknown[]) => createClassroomSession(...args),
  getClassroomSessionById: (...args: unknown[]) => getClassroomSessionById(...args),
  completeClassroomSession: vi.fn(),
  cancelClassroomSession: vi.fn(),
  getAllClassroomSessionAttendances: (...args: unknown[]) =>
    getAllClassroomSessionAttendances(...args),
  createClassroomSessionAttendances: (...args: unknown[]) =>
    createClassroomSessionAttendances(...args),
  updateClassroomSessionAttendance: (...args: unknown[]) =>
    updateClassroomSessionAttendance(...args),
  getAllClassroomScheduleRecurrences: vi.fn(),
  createClassroomScheduleRecurrence: vi.fn(),
  deleteClassroomScheduleRecurrence: vi.fn(),
  getAllClassroomMembers: (...args: unknown[]) => getAllClassroomMembers(...args),
}));

vi.mock("@/shared/api/query-client", () => ({
  queryClient: { invalidateQueries: vi.fn(async () => undefined) },
}));

function upcomingCivilThisMonth(): string {
  // Civil GMT+7 "today" + 1 day, clamped into this month so Upcoming list includes it.
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const lastDay = new Date(Date.UTC(y, shifted.getUTCMonth() + 1, 0)).getUTCDate();
  const d = Math.min(shifted.getUTCDate(), lastDay);
  return `${y}-${m}-${String(d).padStart(2, "0")}`;
}

const createdSession = {
  id: "s1",
  classroomId: "c1",
  sessionDate: upcomingCivilThisMonth(),
  startTime: "09:00:00",
  endTime: "10:00:00",
  status: "OPEN" as const,
  type: "ADHOC" as const,
  name: "Algebra",
  createdDate: "2026-11-12T00:00:00.000Z",
  lastModifiedDate: "2026-11-12T00:00:00.000Z",
};

describe("schedule integration", () => {
  beforeEach(() => {
    getAllClassroomSessions.mockReset();
    createClassroomSession.mockReset();
    getClassroomSessionById.mockReset();
    getAllClassroomSessionAttendances.mockReset();
    createClassroomSessionAttendances.mockReset();
    updateClassroomSessionAttendance.mockReset();
    getAllClassroomMembers.mockReset();
    navigate.mockReset();
  });
  afterEach(() => cleanup());

  it("create session then overview lists it; no tokens in document", async () => {
    createClassroomSession.mockResolvedValue({ data: createdSession });
    getAllClassroomSessions.mockResolvedValue({ data: [createdSession] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <SessionCreate classroomId="c1" />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByTestId("session-date"), {
      target: { value: createdSession.sessionDate },
    });
    fireEvent.click(screen.getByTestId("session-create-save"));
    await waitFor(() => expect(createClassroomSession).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenCalled();

    cleanup();
    render(
      <QueryClientProvider client={client}>
        <SessionOverview classroomId="c1" />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByTestId("sessions-view-list"));
    await waitFor(() => expect(screen.getByTestId("session-row-s1")).toBeTruthy());
    expect(screen.getByText("Algebra")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Bearer |eyJ|access_token/i);
  });

  it("mark attendance then reload shows persisted status", async () => {
    getClassroomSessionById.mockResolvedValue({ data: createdSession });
    getAllClassroomMembers.mockResolvedValue({
      data: [
        {
          id: "m1",
          classroomId: "c1",
          accountId: "a1",
          name: "Ann",
          email: "a@x.com",
          role: "STUDENT",
          status: "ACTIVE",
        },
      ],
    });
    const persistedAttendance = {
      data: [
        {
          id: "att1",
          sessionId: "s1",
          classroomMemberId: "m1",
          status: "ATTENDED",
        },
      ],
    };
    // First paint empty; every later list (save refetch + remount) returns persisted.
    getAllClassroomSessionAttendances
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue(persistedAttendance);
    createClassroomSessionAttendances.mockResolvedValue(persistedAttendance);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <SessionAttendance classroomId="c1" sessionId="s1" />
      </QueryClientProvider>,
    );
    // Roster is always editable when OPEN — no separate attendance-edit unlock.
    await waitFor(() => expect(screen.getByTestId("attendance-present-m1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("attendance-present-m1"));
    await waitFor(() => expect(screen.getByTestId("attendance-save")).toBeTruthy());
    fireEvent.click(screen.getByTestId("attendance-save"));
    await waitFor(() => expect(createClassroomSessionAttendances).toHaveBeenCalled());

    cleanup();
    render(
      <QueryClientProvider client={client}>
        <SessionAttendance classroomId="c1" sessionId="s1" />
      </QueryClientProvider>,
    );
    // OPEN sessions keep Present/Absent toggles; persisted ATTENDED shows as selected.
    await waitFor(() => expect(screen.getByTestId("attendance-present-m1")).toBeTruthy());
    expect(screen.getByTestId("attendance-summary").textContent).toMatch(/1 Present/i);
    expect(createClassroomSessionAttendances).toHaveBeenCalled();
    expect(getAllClassroomSessionAttendances.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

