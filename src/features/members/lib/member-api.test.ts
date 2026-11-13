import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClassroomMemberResponse } from "@/generated/types.gen";
import {
  accountIdsForAdd,
  accountSearchFilter,
  activeMembers,
  attendanceFilter,
  createMembersBody,
  DEFAULT_ATTENDANCE_PAGE_SIZE,
  mapMemberRow,
  MAX_ADD_MEMBERS,
} from "./member-api";

vi.mock("@/generated/sdk.gen", () => ({
  createClassroomMembers: vi.fn(),
  getAllAccounts: vi.fn(),
  getAllClassroomMembers: vi.fn(),
  getClassroomMemberAttendances: vi.fn(),
  removeClassroomMember: vi.fn(),
}));

vi.mock("@/shared/api/query-client", () => ({
  queryClient: { invalidateQueries: vi.fn(async () => undefined) },
}));

function member(
  partial: Partial<ClassroomMemberResponse> &
    Pick<ClassroomMemberResponse, "id" | "accountId" | "status">,
): ClassroomMemberResponse {
  return {
    classroomId: "c1",
    createdDate: "2026-11-12T00:00:00.000Z",
    email: `${partial.accountId}@example.com`,
    lastModifiedDate: "2026-11-12T00:00:00.000Z",
    name: partial.accountId,
    role: "STUDENT",
    ...partial,
  };
}

describe("member api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ACTIVE filter keeps only ACTIVE rows", () => {
    const rows = [
      mapMemberRow(member({ id: "m1", accountId: "a1", status: "ACTIVE" })),
      mapMemberRow(member({ id: "m2", accountId: "a2", status: "REMOVED" })),
      mapMemberRow(member({ id: "m3", accountId: "a3", status: "ACTIVE" })),
    ];
    expect(activeMembers(rows).map((r) => r.id)).toEqual(["m1", "m3"]);
  });

  it("create body uses STUDENT role only", () => {
    expect(createMembersBody(["a1", "a2"])).toEqual({
      members: [
        { accountId: "a1", role: "STUDENT" },
        { accountId: "a2", role: "STUDENT" },
      ],
    });
  });

  it("create body caps at 30 members", () => {
    const ids = Array.from({ length: MAX_ADD_MEMBERS + 5 }, (_, i) => `a${i}`);
    expect(createMembersBody(ids).members).toHaveLength(MAX_ADD_MEMBERS);
  });

  it("skips accounts already ACTIVE when queueing add", () => {
    expect(accountIdsForAdd(["a1", "a2", "a3"], ["a2"])).toEqual(["a1", "a3"]);
  });

  it("add queue also caps at 30 after skipping actives", () => {
    const selected = Array.from({ length: 40 }, (_, i) => `a${i}`);
    expect(accountIdsForAdd(selected, ["a0", "a1"])).toHaveLength(MAX_ADD_MEMBERS);
  });

  it("account search filter uses like on email", () => {
    expect(accountSearchFilter("  ann  ")).toEqual({
      page: 0,
      size: 20,
      filters: [{ field: "email", operator: "like", value: "ann" }],
    });
    expect(accountSearchFilter("   ")).toEqual({ page: 0, size: 20 });
  });

  it("attendance filter defaults page 0 and size 20", () => {
    expect(attendanceFilter()).toEqual({
      page: 0,
      size: DEFAULT_ATTENDANCE_PAGE_SIZE,
    });
    expect(attendanceFilter(2, 10)).toEqual({ page: 2, size: 10 });
  });
});
