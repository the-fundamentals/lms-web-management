import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeeklySchedule } from "./weekly-schedule";

const createRecurrence = vi.hoisted(() => vi.fn());

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
    createRecurrence: (...args: unknown[]) => createRecurrence(...args),
  };
});

function renderWeekly(props?: { initialStartDate?: string; embedded?: boolean }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WeeklySchedule classroomId="c1" {...props} />
    </QueryClientProvider>,
  );
}

describe("weekly schedule", () => {
  beforeEach(() => {
    createRecurrence.mockReset();
  });
  afterEach(() => cleanup());

  it("save posts WEEKLY recurrence", async () => {
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

  it("initialStartDate prefills that weekday (calendar + → recurring)", async () => {
    // 2026-11-14 = Saturday
    renderWeekly({ embedded: true, initialStartDate: "2026-11-14" });
    await waitFor(() => expect(screen.getByTestId("weekly-form")).toBeTruthy());
    expect((screen.getByTestId("weekly-start-date") as HTMLInputElement).value).toBe(
      "2026-11-14",
    );
    expect((screen.getByTestId("weekly-day-SATURDAY") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByTestId("weekly-day-MONDAY") as HTMLInputElement).checked).toBe(false);
  });

  it("double-submit does not stack saves", async () => {
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
    createRecurrence.mockResolvedValue([]);
    renderWeekly();
    await waitFor(() => expect(screen.getByTestId("weekly-schedule")).toBeTruthy());
    expect(screen.getByText(/does not create sessions/i)).toBeTruthy();
  });
});
