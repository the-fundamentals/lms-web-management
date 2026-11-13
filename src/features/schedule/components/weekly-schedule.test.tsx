import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeeklySchedule } from "./weekly-schedule";

const listRecurrences = vi.hoisted(() => vi.fn());
const createRecurrence = vi.hoisted(() => vi.fn());
const deleteRecurrence = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useBlocker: vi.fn(),
}));

vi.mock("../lib/session-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/session-api")>("../lib/session-api");
  return {
    ...actual,
    recurrencesQueryOptions: (classroomId: string) => ({
      queryKey: ["rec", classroomId],
      queryFn: () => listRecurrences(classroomId),
    }),
    createRecurrence: (...args: unknown[]) => createRecurrence(...args),
    deleteRecurrence: (...args: unknown[]) => deleteRecurrence(...args),
  };
});

function renderWeekly() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WeeklySchedule classroomId="c1" />
    </QueryClientProvider>,
  );
}

describe("weekly schedule", () => {
  beforeEach(() => {
    listRecurrences.mockReset();
    createRecurrence.mockReset();
    deleteRecurrence.mockReset();
  });
  afterEach(() => cleanup());

  it("lists rows and can delete", async () => {
    listRecurrences.mockResolvedValue([
      {
        id: "r1",
        classroomId: "c1",
        byDay: "MONDAY",
        recurrenceStartDate: "2026-07-01",
        startTime: "09:00:00",
        endTime: "10:00:00",
      },
    ]);
    deleteRecurrence.mockResolvedValue(undefined);
    listRecurrences.mockResolvedValueOnce([
      {
        id: "r1",
        classroomId: "c1",
        byDay: "MONDAY",
        recurrenceStartDate: "2026-07-01",
        startTime: "09:00:00",
        endTime: "10:00:00",
      },
    ]).mockResolvedValueOnce([]);
    renderWeekly();
    await waitFor(() => expect(screen.getByTestId("weekly-row-r1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("weekly-delete-r1"));
    await waitFor(() => expect(deleteRecurrence).toHaveBeenCalledWith("c1", "r1"));
  });

  it("save posts WEEKLY recurrence", async () => {
    listRecurrences.mockResolvedValue([]);
    createRecurrence.mockResolvedValue([]);
    renderWeekly();
    await waitFor(() => expect(screen.getByTestId("weekly-form")).toBeTruthy());
    fireEvent.click(screen.getByTestId("weekly-day-MONDAY"));
    fireEvent.change(screen.getByTestId("weekly-start-date"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.click(screen.getByTestId("weekly-save"));
    await waitFor(() => expect(createRecurrence).toHaveBeenCalledTimes(1));
    expect(createRecurrence).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        byDays: ["MONDAY"],
        recurrenceStartDate: "2026-07-01",
      }),
    );
  });

  it("double-submit does not stack saves", async () => {
    listRecurrences.mockResolvedValue([]);
    let resolveSave: (v: unknown) => void = () => undefined;
    createRecurrence.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderWeekly();
    await waitFor(() => expect(screen.getByTestId("weekly-form")).toBeTruthy());
    fireEvent.click(screen.getByTestId("weekly-day-MONDAY"));
    fireEvent.change(screen.getByTestId("weekly-start-date"), {
      target: { value: "2026-07-01" },
    });
    const form = screen.getByTestId("weekly-form");
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(createRecurrence).toHaveBeenCalledTimes(1));
    resolveSave([]);
    await waitFor(() => expect(createRecurrence).toHaveBeenCalledTimes(1));
  });

  it("dirty form arms leave blocker", async () => {
    const { useBlocker } = await import("@tanstack/react-router");
    listRecurrences.mockResolvedValue([]);
    renderWeekly();
    await waitFor(() => expect(screen.getByTestId("weekly-form")).toBeTruthy());
    fireEvent.click(screen.getByTestId("weekly-day-MONDAY"));
    expect(useBlocker).toHaveBeenCalled();
    const last = vi.mocked(useBlocker).mock.calls.at(-1)?.[0] as {
      shouldBlockFn: () => boolean;
      enableBeforeUnload?: boolean;
    };
    expect(last.enableBeforeUnload).toBe(true);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    expect(last.shouldBlockFn()).toBe(true);
    confirmSpy.mockRestore();
  });

  it("save does not invent session rows on the form copy", async () => {
    listRecurrences.mockResolvedValue([]);
    createRecurrence.mockResolvedValue([]);
    renderWeekly();
    await waitFor(() => expect(screen.getByTestId("weekly-schedule")).toBeTruthy());
    expect(screen.getByText(/does not create sessions/i)).toBeTruthy();
  });

  it("empty list copy when no weekly rows", async () => {
    listRecurrences.mockResolvedValue([]);
    renderWeekly();
    await waitFor(() => expect(screen.getByText(/no weekly times yet/i)).toBeTruthy());
  });
});

