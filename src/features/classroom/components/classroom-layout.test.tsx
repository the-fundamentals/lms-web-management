import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { classroomRow } from "../lib/classroom-row-fixture";
import { ClassroomLayout } from "./classroom-layout";

const fetchClassroom = vi.hoisted(() => vi.fn());

const navigate = vi.hoisted(() => vi.fn());
const pathname = vi.hoisted(() => ({ current: "/classrooms/c1" }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="router-outlet-child">outlet</div>,
  useNavigate: () => navigate,
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: pathname.current } }),
}));

vi.mock("../lib/classroom-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/classroom-api")>("../lib/classroom-api");
  return {
    ...actual,
    fetchClassroom: (...args: unknown[]) => fetchClassroom(...args),
  };
});

function renderLayout(onTitleChange?: (name: string | undefined) => void) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ClassroomLayout classroomId="c1" onTitleChange={onTitleChange} />
    </QueryClientProvider>,
  );
}

describe("classroom layout", () => {
  beforeEach(() => {
    fetchClassroom.mockReset();
    navigate.mockReset();
    pathname.current = "/classrooms/c1";
  });

  afterEach(() => {
    cleanup();
  });

  it("loaded classroom name is shown", async () => {
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Algebra" })).toBeTruthy());
  });

  it("shows banner and overview meta", async () => {
    fetchClassroom.mockResolvedValue(
      classroomRow({ id: "c1", name: "Algebra", numberOfMembers: 3, status: "ACTIVE" }),
    );
    renderLayout();
    await waitFor(() => expect(screen.getByTestId("classroom-banner")).toBeTruthy());
    expect(screen.getByTestId("classroom-overview")).toBeTruthy();
    expect(screen.getAllByText("3 members").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ACTIVE").length).toBeGreaterThan(0);
  });

  it("sessions outlet stays mounted; Members Money Settings enabled", async () => {
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout();
    await waitFor(() => expect(screen.getByTestId("classroom-tabs")).toBeTruthy());
    expect(screen.getByTestId("classroom-outlet")).toBeTruthy();
    expect(screen.getByTestId("router-outlet-child")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Members" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("tab", { name: "Money" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("tab", { name: "Settings" }).hasAttribute("disabled")).toBe(false);
    expect(screen.queryByRole("tab", { name: "Attendance" })).toBeNull();
  });

  it("Money tab navigates to invoices", async () => {
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout();
    await waitFor(() => expect(screen.getByRole("tab", { name: "Money" })).toBeTruthy());
    fireEvent.click(screen.getByRole("tab", { name: "Money" }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/classrooms/$classroomId/money/invoices",
        params: { classroomId: "c1" },
      }),
    );
  });

  it("Settings tab navigates to settings", async () => {
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout();
    await waitFor(() => expect(screen.getByRole("tab", { name: "Settings" })).toBeTruthy());
    fireEvent.click(screen.getByRole("tab", { name: "Settings" }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/classrooms/$classroomId/settings",
        params: { classroomId: "c1" },
      }),
    );
  });

  it("Members tab navigates to the members route", async () => {
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout();
    await waitFor(() => expect(screen.getByRole("tab", { name: "Members" })).toBeTruthy());
    // Radix tab triggers are buttons; click the role for reliable onValueChange in jsdom.
    fireEvent.click(screen.getByRole("tab", { name: "Members" }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/classrooms/$classroomId/members",
        params: { classroomId: "c1" },
      }),
    );
  });

  it("Sessions tab navigates to the sessions route", async () => {
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout();
    await waitFor(() => expect(screen.getByRole("tab", { name: "Sessions" })).toBeTruthy());
    fireEvent.click(screen.getByRole("tab", { name: "Sessions" }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/classrooms/$classroomId/sessions",
        params: { classroomId: "c1" },
      }),
    );
  });

  it("reports the classroom name for the header breadcrumb", async () => {
    const onTitleChange = vi.fn();
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout(onTitleChange);
    await waitFor(() => expect(onTitleChange).toHaveBeenCalledWith("Algebra"));
  });

  it("missing classroom uses the shared error screen", async () => {
    fetchClassroom.mockRejectedValue(new Error("not found"));
    renderLayout();
    await waitFor(() => expect(screen.getByTestId("error-screen")).toBeTruthy());
  });

  it("no session list or calendar is rendered on overview", async () => {
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Algebra" })).toBeTruthy());
    expect(screen.queryByText(/session list/i)).toBeNull();
    expect(screen.queryByText(/calendar/i)).toBeNull();
  });

  it("overview has no rename entry", async () => {
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout();
    await waitFor(() => expect(screen.getByTestId("classroom-overview")).toBeTruthy());
    expect(screen.queryByTestId("classroom-rename-entry")).toBeNull();
  });

  it("hero does not duplicate All classrooms (sidebar owns that link)", async () => {
    fetchClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Algebra" }));
    renderLayout();
    await waitFor(() => expect(screen.getByTestId("classroom-shell")).toBeTruthy());
    expect(screen.queryByRole("link", { name: /all classrooms/i })).toBeNull();
  });
});
