import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemberList } from "./member-list";

const getAllClassroomMembers = vi.hoisted(() => vi.fn());
const createClassroomMembers = vi.hoisted(() => vi.fn());
const removeClassroomMember = vi.hoisted(() => vi.fn());
const getAllAccounts = vi.hoisted(() => vi.fn());

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
    if (to.includes("$memberId")) {
      href = `/classrooms/${params?.classroomId}/members/${params?.memberId}`;
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/generated/sdk.gen", () => ({
  getAllClassroomMembers: (...args: unknown[]) => getAllClassroomMembers(...args),
  createClassroomMembers: (...args: unknown[]) => createClassroomMembers(...args),
  removeClassroomMember: (...args: unknown[]) => removeClassroomMember(...args),
  getAllAccounts: (...args: unknown[]) => getAllAccounts(...args),
  getClassroomMemberAttendances: vi.fn(),
}));

vi.mock("@/shared/api/query-client", () => ({
  queryClient: {
    invalidateQueries: vi.fn(async () => undefined),
  },
}));

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

const baseMember = {
  classroomId: "c1",
  createdDate: "2026-11-12T00:00:00.000Z",
  lastModifiedDate: "2026-11-12T00:00:00.000Z",
  role: "STUDENT" as const,
};

describe("members integration", () => {
  beforeEach(() => {
    getAllClassroomMembers.mockReset();
    createClassroomMembers.mockReset();
    removeClassroomMember.mockReset();
    getAllAccounts.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("list → add → list includes new student", async () => {
    getAllClassroomMembers.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
      data: [
        {
          ...baseMember,
          id: "m2",
          accountId: "a2",
          email: "new@example.com",
          name: "New Kid",
          status: "ACTIVE",
        },
      ],
    });
    getAllAccounts.mockResolvedValue({
      data: [
        {
          id: "a2",
          cognitoSub: "sub",
          email: "new@example.com",
          firstName: "New",
          lastName: "Kid",
          avatarKey: "",
          createdDate: "2026-11-12T00:00:00.000Z",
          lastModifiedDate: "2026-11-12T00:00:00.000Z",
        },
      ],
    });
    createClassroomMembers.mockResolvedValue({
      data: [
        {
          ...baseMember,
          id: "m2",
          accountId: "a2",
          email: "new@example.com",
          name: "New Kid",
          status: "ACTIVE",
        },
      ],
    });

    renderList();
    await waitFor(() => expect(screen.getByTestId("member-list-empty")).toBeTruthy());
    fireEvent.click(screen.getByTestId("add-member"));
    fireEvent.change(screen.getByTestId("member-search"), { target: { value: "new@" } });
    await vi.advanceTimersByTimeAsync(350);
    await waitFor(() => expect(screen.getByTestId("member-search-row-a2")).toBeTruthy());
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByTestId("member-add-save"));
    await waitFor(() => expect(createClassroomMembers).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("member-row-m2")).toBeTruthy());
    expect(document.body.textContent).not.toMatch(/Bearer |eyJ|access_token/i);
  });

  it("remove with named confirm clears them from ACTIVE list", async () => {
    getAllClassroomMembers
      .mockResolvedValueOnce({
        data: [
          {
            ...baseMember,
            id: "m1",
            accountId: "a1",
            email: "ann@example.com",
            name: "Ann Active",
            status: "ACTIVE",
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });
    removeClassroomMember.mockResolvedValue({ data: undefined });

    renderList();
    await waitFor(() => expect(screen.getByTestId("member-row-m1")).toBeTruthy());
    fireEvent.pointerDown(screen.getByTestId("member-menu-m1"));
    await waitFor(() => expect(screen.getByTestId("member-remove-m1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("member-remove-m1"));
    await waitFor(() => expect(screen.getByTestId("member-remove-dialog")).toBeTruthy());
    expect(
      screen.getByTestId("member-remove-dialog").textContent?.toLowerCase(),
    ).toContain("remove ann active");
    fireEvent.click(screen.getByTestId("member-remove-confirm"));
    await waitFor(() =>
      expect(removeClassroomMember).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { classroomId: "c1", memberId: "m1" },
        }),
      ),
    );
    await waitFor(() => expect(screen.getByTestId("member-list-empty")).toBeTruthy());
    expect(document.body.textContent).not.toMatch(/Bearer |eyJ|access_token/i);
  });
});
