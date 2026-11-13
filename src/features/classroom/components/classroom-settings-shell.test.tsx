import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClassroomSettingsShell } from "./classroom-settings-shell";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...rest
  }: {
    children?: ReactNode;
    to: string;
    params?: { classroomId?: string };
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="settings-outlet-stub">pane</div>,
  useRouterState: ({
    select,
  }: {
    select: (s: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: "/classrooms/c1/settings" } }),
}));

describe("classroom settings shell", () => {
  afterEach(() => cleanup());

  it("renders left nav for General and Pricing", () => {
    render(<ClassroomSettingsShell classroomId="c1" />);
    expect(screen.getByTestId("classroom-settings")).toBeTruthy();
    expect(screen.getByTestId("settings-nav-general")).toBeTruthy();
    expect(screen.getByTestId("settings-nav-pricing")).toBeTruthy();
    expect(screen.getByTestId("settings-pane")).toBeTruthy();
  });
});
