import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memberRow } from "../lib/member-row-fixture";
import { MemberList } from "./member-list";

const listMembers = vi.hoisted(() => vi.fn());
const removeMember = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    params,
    to,
    ...rest
  }: {
    children?: ReactNode;
    params?: { classroomId?: string; memberId?: string };
    to: string;
  }) => {
    let href = to;
    if (to === "/classrooms/$classroomId/members/$memberId") {
      href = `/classrooms/${params?.classroomId}/members/${params?.memberId}`;
    } else if (to === "/classrooms/$classroomId/members") {
      href = `/classrooms/${params?.classroomId}/members`;
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("../lib/member-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/member-api")>("../lib/member-api");
  return {
    ...actual,
    membersQueryOptions: (classroomId: string) => ({
      queryKey: ["classroom-members", classroomId, "test"],
      queryFn: () => listMembers(classroomId),
    }),
    removeMember: (...args: unknown[]) => removeMember(...args),
  };
});

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemberList classroomId="c1" />
    </QueryClientProvider>,
  );
}

describe("member list", () => {
  beforeEach(() => {
    listMembers.mockReset();
    removeMember.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("empty state offers Add with data-testid add-member", async () => {
    listMembers.mockResolvedValue([]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("member-list-empty")).toBeTruthy());
    expect(screen.getByText(/no people yet/i)).toBeTruthy();
    expect(screen.getByTestId("add-member")).toBeTruthy();
  });

  it("failed load uses shared error screen not empty copy", async () => {
    listMembers.mockRejectedValue(new Error("boom"));
    renderList();
    await waitFor(() => expect(screen.getByTestId("error-screen")).toBeTruthy());
    expect(screen.queryByText(/no people yet/i)).toBeNull();
  });

  it("ACTIVE rows render; REMOVED are hidden", async () => {
    listMembers.mockResolvedValue([
      memberRow({ id: "m1", name: "Ann", status: "ACTIVE" }),
      memberRow({ id: "m2", name: "Bob", status: "REMOVED" }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("member-row-m1")).toBeTruthy());
    expect(screen.queryByTestId("member-row-m2")).toBeNull();
    expect(screen.getByText("Ann")).toBeTruthy();
    expect(screen.queryByText("Bob")).toBeNull();
  });

  it("loading uses shared loading screen", () => {
    listMembers.mockReturnValue(new Promise(() => undefined));
    renderList();
    expect(screen.getByTestId("loading-screen")).toBeTruthy();
  });

  it("remove is behind the row menu and opens named confirmation", async () => {
    listMembers.mockResolvedValue([memberRow({ id: "m1", name: "Ann Active" })]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("member-menu-m1")).toBeTruthy());
    expect(screen.queryByTestId("member-attendance-m1")).toBeNull();
    // Radix DropdownMenu opens on pointerdown, not click alone, in jsdom.
    fireEvent.pointerDown(screen.getByTestId("member-menu-m1"));
    await waitFor(() => expect(screen.getByTestId("member-remove-m1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("member-remove-m1"));
    await waitFor(() => expect(screen.getByTestId("member-remove-dialog")).toBeTruthy());
    expect(
      screen.getByTestId("member-remove-dialog").textContent?.toLowerCase(),
    ).toContain("remove ann active");
  });
});
