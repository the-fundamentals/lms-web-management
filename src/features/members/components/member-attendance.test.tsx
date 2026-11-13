import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { attendanceRow } from "../lib/member-row-fixture";
import { MemberAttendance } from "./member-attendance";

const listMemberAttendances = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    params,
    to,
    ...rest
  }: {
    children?: ReactNode;
    params?: { classroomId?: string };
    to: string;
  }) => {
    const href =
      to === "/classrooms/$classroomId/members"
        ? `/classrooms/${params?.classroomId}/members`
        : to;
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
    memberAttendancesQueryOptions: (classroomId: string, memberId: string, page: number) => ({
      queryKey: ["attendances", classroomId, memberId, page],
      queryFn: () => listMemberAttendances(classroomId, memberId, page),
    }),
  };
});

function renderAttendance() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemberAttendance classroomId="c1" memberId="m1" />
    </QueryClientProvider>,
  );
}

describe("member attendance", () => {
  beforeEach(() => {
    listMemberAttendances.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders paginated rows", async () => {
    listMemberAttendances.mockResolvedValue([
      attendanceRow({ id: "a1", status: "ATTENDED" }),
      attendanceRow({ id: "a2", status: "ABSENT" }),
    ]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("member-attendance-list")).toBeTruthy());
    expect(screen.getByTestId("member-attendance-row-a1")).toBeTruthy();
    expect(screen.getByTestId("member-attendance-row-a2")).toBeTruthy();
    expect(screen.getByText("ATTENDED")).toBeTruthy();
  });

  it("empty history copy", async () => {
    listMemberAttendances.mockResolvedValue([]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("member-attendance-empty")).toBeTruthy());
    expect(screen.getByText(/no attendance yet/i)).toBeTruthy();
  });

  it("error path uses shared error screen", async () => {
    listMemberAttendances.mockRejectedValue(new Error("missing"));
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("error-screen")).toBeTruthy());
  });

  it("back links to members list", async () => {
    listMemberAttendances.mockResolvedValue([]);
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("member-attendance-back")).toBeTruthy());
    expect(screen.getByTestId("member-attendance-back").getAttribute("href")).toBe(
      "/classrooms/c1/members",
    );
  });

  it("next page requests the following page", async () => {
    const full = Array.from({ length: 20 }, (_, i) => attendanceRow({ id: `r${i}` }));
    listMemberAttendances.mockImplementation((_c: string, _m: string, page: number) =>
      Promise.resolve(page === 0 ? full : [attendanceRow({ id: "page2" })]),
    );
    renderAttendance();
    await waitFor(() => expect(screen.getByTestId("member-attendance-next")).toBeTruthy());
    fireEvent.click(screen.getByTestId("member-attendance-next"));
    await waitFor(() => expect(listMemberAttendances).toHaveBeenCalledWith("c1", "m1", 1));
    await waitFor(() => expect(screen.getByTestId("member-attendance-row-page2")).toBeTruthy());
  });
});
