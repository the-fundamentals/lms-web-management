import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionOverview } from "./session-overview";

const listSessions = vi.hoisted(() => vi.fn());
const listRecurrences = vi.hoisted(() => vi.fn());

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
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
  useNavigate: () => vi.fn(async () => undefined),
  useBlocker: vi.fn(),
}));

vi.mock("../lib/session-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/session-api")>("../lib/session-api");
  return {
    ...actual,
    // Forward range so list filters hit the same query path as production.
    sessionsQueryOptions: (
      classroomId: string,
      range?: { from: string; to: string },
    ) => ({
      queryKey: [
        "classroom-sessions",
        classroomId,
        "range",
        range?.from ?? "",
        range?.to ?? "",
      ],
      queryFn: () => listSessions(classroomId, range),
    }),
    recurrencesQueryOptions: (classroomId: string) => ({
      queryKey: ["classroom-recurrences", classroomId, "test"],
      queryFn: () => listRecurrences(classroomId),
    }),
  };
});

function renderOverview() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SessionOverview classroomId="c1" />
    </QueryClientProvider>,
  );
}

describe("session overview", () => {
  beforeEach(() => {
    listSessions.mockReset();
    listRecurrences.mockReset();
    listRecurrences.mockResolvedValue([]);
  });
  afterEach(() => cleanup());

  it("defaults to calendar view", async () => {
    listSessions.mockResolvedValue([]);
    renderOverview();
    expect(screen.getByTestId("sessions-view-calendar").getAttribute("aria-pressed")).toBe(
      "true",
    );
    await waitFor(() => expect(screen.getByTestId("calendar-grid")).toBeTruthy());
  });

  it("status filters default on and can hide cancelled from calendar", async () => {
    const now = new Date();
    const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    const date = `${y}-${m}-${d}`;
    listSessions.mockResolvedValue([
      {
        id: "open1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "OPEN",
        type: "ADHOC",
      },
      {
        id: "cancel1",
        classroomId: "c1",
        sessionDate: date,
        startTime: "11:00:00",
        endTime: "12:00:00",
        status: "CANCELLED",
        type: "SCHEDULE",
      },
    ]);
    renderOverview();
    await waitFor(() => expect(screen.getByTestId("sessions-status-filter")).toBeTruthy());
    // Radix DropdownMenu opens on pointerdown in jsdom.
    fireEvent.pointerDown(screen.getByTestId("sessions-status-filter"));
    await waitFor(() => expect(screen.getByTestId("sessions-status-filter-menu")).toBeTruthy());
    expect(screen.getByTestId("sessions-status-open").getAttribute("data-state")).toBe("checked");
    expect(screen.getByTestId("sessions-status-completed").getAttribute("data-state")).toBe(
      "checked",
    );
    expect(screen.getByTestId("sessions-status-cancelled").getAttribute("data-state")).toBe(
      "checked",
    );
    await waitFor(() => expect(screen.getByTestId("calendar-session-cancel1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("sessions-status-cancelled"));
    await waitFor(() => expect(screen.queryByTestId("calendar-session-cancel1")).toBeNull());
    expect(screen.getByTestId("calendar-session-open1")).toBeTruthy();
  });

  it("list empty state offers new session", async () => {
    listSessions.mockResolvedValue([]);
    renderOverview();
    fireEvent.click(screen.getByTestId("sessions-view-list"));
    await waitFor(() => expect(screen.getByTestId("session-overview-empty")).toBeTruthy());
    expect(screen.getByTestId("new-session-empty")).toBeTruthy();
  });

  it("list range presets pass a date window into listSessions", async () => {
    listSessions.mockResolvedValue([]);
    renderOverview();
    fireEvent.click(screen.getByTestId("sessions-view-list"));
    await waitFor(() => expect(screen.getByTestId("session-list-range-filter")).toBeTruthy());
    const weekCall = listSessions.mock.calls.at(-1);
    expect(weekCall?.[0]).toBe("c1");
    expect(weekCall?.[1]).toEqual(
      expect.objectContaining({ from: expect.any(String), to: expect.any(String) }),
    );

    fireEvent.click(screen.getByTestId("list-range-this_month"));
    await waitFor(() => {
      const monthCall = listSessions.mock.calls.at(-1);
      expect(monthCall?.[1]).toEqual(
        expect.objectContaining({ from: expect.any(String), to: expect.any(String) }),
      );
      expect(monthCall?.[1]).not.toEqual(weekCall?.[1]);
    });

    const filter = screen.getByTestId("session-list-range-filter");
    expect(filter.getAttribute("data-range-from")).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it("header new opens compose sheet with adhoc/recurring toggle", async () => {
    listSessions.mockResolvedValue([]);
    renderOverview();
    fireEvent.click(screen.getByTestId("new-session"));
    await waitFor(() => expect(screen.getByTestId("session-compose-sheet")).toBeTruthy());
    expect(screen.getByTestId("compose-mode-adhoc").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByTestId("compose-mode-recurring"));
    await waitFor(() => expect(screen.getByTestId("weekly-form")).toBeTruthy());
  });

  it("calendar day add prefills compose date", async () => {
    listSessions.mockResolvedValue([]);
    renderOverview();
    await waitFor(() => expect(screen.getByTestId("calendar-grid")).toBeTruthy());
    const add = screen.getByTestId("calendar-grid").querySelector("[data-testid^='calendar-add-']");
    expect(add).toBeTruthy();
    const date = add!.getAttribute("data-testid")!.replace("calendar-add-", "");
    fireEvent.click(add!);
    await waitFor(() => expect(screen.getByTestId("session-compose-sheet")).toBeTruthy());
    expect((screen.getByTestId("session-date") as HTMLInputElement).value).toBe(date);
    expect((screen.getByTestId("session-start") as HTMLInputElement).value).toBe("09:00");
    expect((screen.getByTestId("session-end") as HTMLInputElement).value).toBe("10:00");
  });

  it("renders a session row link with type in list view", async () => {
    // Use a far-future date in the same civil month as "now" is unreliable;
    // OPEN far future lands in upcoming only if month matches — use COMPLETED past instead for row chrome.
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: "2020-01-01",
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "COMPLETED",
        type: "SCHEDULE",
        name: "Past session",
      },
    ]);
    renderOverview();
    fireEvent.click(screen.getByTestId("sessions-view-list"));
    // Past starts collapsed — expand it.
    await waitFor(() => expect(screen.getByTestId("session-group-toggle-past")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-group-toggle-past"));
    await waitFor(() => expect(screen.getByTestId("session-row-s1")).toBeTruthy());
    expect(screen.getByTestId("session-type-s1").textContent).toMatch(/Schedule/i);
    expect(screen.getByTestId("session-row-s1").getAttribute("href")).toBe(
      "/classrooms/c1/sessions/s1",
    );
  });

  it("can collapse an expanded group", async () => {
    listSessions.mockResolvedValue([
      {
        id: "s1",
        classroomId: "c1",
        sessionDate: "2020-01-01",
        startTime: "09:00:00",
        endTime: "10:00:00",
        status: "COMPLETED",
        type: "ADHOC",
        name: "Past session",
      },
    ]);
    renderOverview();
    fireEvent.click(screen.getByTestId("sessions-view-list"));
    await waitFor(() => expect(screen.getByTestId("session-group-toggle-past")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-group-toggle-past"));
    await waitFor(() => expect(screen.getByTestId("session-row-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("session-group-toggle-past"));
    expect(screen.queryByTestId("session-row-s1")).toBeNull();
  });
});
