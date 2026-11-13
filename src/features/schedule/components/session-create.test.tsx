import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionCreate } from "./session-create";

const createSession = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
  useBlocker: vi.fn(),
}));

vi.mock("../lib/session-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/session-api")>("../lib/session-api");
  return {
    ...actual,
    createSession: (...args: unknown[]) => createSession(...args),
  };
});

describe("session create", () => {
  beforeEach(() => {
    createSession.mockReset();
    navigate.mockReset();
  });
  afterEach(() => cleanup());

  it("posts create once and navigates back", async () => {
    createSession.mockResolvedValue({ id: "s1" });
    render(<SessionCreate classroomId="c1" />);
    fireEvent.change(screen.getByTestId("session-date"), { target: { value: "2026-07-19" } });
    fireEvent.click(screen.getByTestId("session-create-save"));
    await waitFor(() => expect(createSession).toHaveBeenCalledTimes(1));
    expect(createSession).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        sessionDate: "2026-07-19",
        startTime: "09:00",
        endTime: "10:00",
      }),
    );
    expect(navigate).toHaveBeenCalled();
  });

  it("double-submit guard", async () => {
    let resolveCreate: (v: unknown) => void = () => undefined;
    createSession.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    render(<SessionCreate classroomId="c1" />);
    fireEvent.change(screen.getByTestId("session-date"), { target: { value: "2026-07-19" } });
    fireEvent.click(screen.getByTestId("session-create-save"));
    fireEvent.click(screen.getByTestId("session-create-save"));
    expect(createSession).toHaveBeenCalledTimes(1);
    resolveCreate({ id: "s1" });
    await waitFor(() => expect(navigate).toHaveBeenCalled());
  });

  it("server error stays on form", async () => {
    createSession.mockRejectedValue(new Error("nope"));
    render(<SessionCreate classroomId="c1" />);
    fireEvent.change(screen.getByTestId("session-date"), { target: { value: "2026-07-19" } });
    fireEvent.click(screen.getByTestId("session-create-save"));
    await waitFor(() => expect(screen.getByTestId("session-create-error")).toBeTruthy());
    expect(navigate).not.toHaveBeenCalled();
  });

  it("dirty form arms leave blocker", async () => {
    const { useBlocker } = await import("@tanstack/react-router");
    render(<SessionCreate classroomId="c1" />);
    fireEvent.change(screen.getByTestId("session-date"), { target: { value: "2026-07-19" } });
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

  it("optional name is passed when set", async () => {
    createSession.mockResolvedValue({ id: "s1" });
    render(<SessionCreate classroomId="c1" />);
    fireEvent.change(screen.getByTestId("session-date"), { target: { value: "2026-07-19" } });
    fireEvent.change(screen.getByTestId("session-name"), { target: { value: " Algebra " } });
    fireEvent.click(screen.getByTestId("session-create-save"));
    await waitFor(() => expect(createSession).toHaveBeenCalled());
    expect(createSession).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ name: "Algebra" }),
    );
  });
});
