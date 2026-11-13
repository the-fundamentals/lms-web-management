import {
  createClassroomMembers,
  getAllAccounts,
  getAllClassroomMembers,
  getClassroomMemberAttendances,
  removeClassroomMember,
} from "@/generated/sdk.gen";
import type {
  AccountFilter,
  AccountProfileResponse,
  ClassroomMemberResponse,
  ClassroomSessionAttendanceFilter,
  ClassroomSessionAttendanceResponse,
  CreateClassroomMembersCommand,
} from "@/generated/types.gen";
import { queryClient } from "@/shared/api/query-client";

export const MAX_ADD_MEMBERS = 30;
export const DEFAULT_ATTENDANCE_PAGE_SIZE = 20;
export const DEFAULT_ACCOUNT_SEARCH_SIZE = 20;

export const membersQueryKey = ["classroom-members"] as const;

export type MemberRow = {
  id: string;
  classroomId: string;
  accountId: string;
  role: ClassroomMemberResponse["role"];
  status: ClassroomMemberResponse["status"];
  email: string;
  name: string;
  avatar?: string;
};

export type AccountRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarKey?: string;
};

export type AttendanceRow = {
  id: string;
  sessionId: string;
  classroomMemberId: string;
  status: ClassroomSessionAttendanceResponse["status"];
  attendanceDate?: string;
  createdDate: string;
};

export function mapMemberRow(member: ClassroomMemberResponse): MemberRow {
  return {
    id: member.id,
    classroomId: member.classroomId,
    accountId: member.accountId,
    role: member.role,
    status: member.status,
    email: member.email,
    name: member.name,
    ...(member.avatar ? { avatar: member.avatar } : {}),
  };
}

export function mapMemberRows(members: ClassroomMemberResponse[]): MemberRow[] {
  return members.map(mapMemberRow);
}

/** FR3.1 list shows ACTIVE only; REMOVED stay out. */
export function activeMembers(members: MemberRow[]): MemberRow[] {
  return members.filter((member) => member.status === "ACTIVE");
}

export function mapAccountRow(account: AccountProfileResponse): AccountRow {
  return {
    id: account.id,
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    ...(account.avatarKey ? { avatarKey: account.avatarKey } : {}),
  };
}

export function mapAttendanceRow(
  row: ClassroomSessionAttendanceResponse,
): AttendanceRow {
  return {
    id: row.id,
    sessionId: row.sessionId,
    classroomMemberId: row.classroomMemberId,
    status: row.status,
    createdDate: row.createdDate,
    ...(row.attendanceDate ? { attendanceDate: row.attendanceDate } : {}),
  };
}

/** Create body: STUDENT-only, capped at 30. */
export function createMembersBody(accountIds: string[]): CreateClassroomMembersCommand {
  return {
    members: accountIds.slice(0, MAX_ADD_MEMBERS).map((accountId) => ({
      accountId,
      role: "STUDENT",
    })),
  };
}

/** Drop accounts already ACTIVE in the class, then cap at 30. */
export function accountIdsForAdd(
  selectedAccountIds: string[],
  activeAccountIds: Iterable<string>,
): string[] {
  const active = new Set(activeAccountIds);
  return selectedAccountIds
    .filter((id) => !active.has(id))
    .slice(0, MAX_ADD_MEMBERS);
}

export function accountSearchFilter(query: string): AccountFilter {
  const trimmed = query.trim();
  const base: AccountFilter = {
    page: 0,
    size: DEFAULT_ACCOUNT_SEARCH_SIZE,
  };
  if (trimmed.length === 0) return base;
  // Email `like` only — OpenAPI filter arrays AND; multi-field would over-constrain.
  return {
    ...base,
    filters: [{ field: "email", operator: "like", value: trimmed }],
  };
}

export function attendanceFilter(
  page = 0,
  size = DEFAULT_ATTENDANCE_PAGE_SIZE,
): ClassroomSessionAttendanceFilter {
  return { page, size };
}

export async function listMembers(classroomId: string): Promise<MemberRow[]> {
  const result = await getAllClassroomMembers({
    path: { classroomId },
    throwOnError: true,
  });
  return mapMemberRows(result.data ?? []);
}

export async function addMembers(
  classroomId: string,
  accountIds: string[],
): Promise<MemberRow[]> {
  const result = await createClassroomMembers({
    path: { classroomId },
    body: createMembersBody(accountIds),
    throwOnError: true,
  });
  await queryClient.invalidateQueries({
    queryKey: [...membersQueryKey, classroomId],
  });
  return mapMemberRows(result.data ?? []);
}

export async function removeMember(
  classroomId: string,
  memberId: string,
): Promise<void> {
  await removeClassroomMember({
    path: { classroomId, memberId },
    throwOnError: true,
  });
  await queryClient.invalidateQueries({
    queryKey: [...membersQueryKey, classroomId],
  });
}

export async function searchAccounts(query: string): Promise<AccountRow[]> {
  const result = await getAllAccounts({
    body: accountSearchFilter(query),
    throwOnError: true,
  });
  return (result.data ?? []).map(mapAccountRow);
}

export async function listMemberAttendances(
  classroomId: string,
  memberId: string,
  page = 0,
): Promise<AttendanceRow[]> {
  const result = await getClassroomMemberAttendances({
    path: { classroomId, memberId },
    body: attendanceFilter(page),
    throwOnError: true,
  });
  return (result.data ?? []).map(mapAttendanceRow);
}

export function membersQueryOptions(classroomId: string) {
  return {
    queryKey: [...membersQueryKey, classroomId] as const,
    queryFn: () => listMembers(classroomId),
  };
}

export function memberAttendancesQueryOptions(
  classroomId: string,
  memberId: string,
  page: number,
) {
  return {
    queryKey: [
      ...membersQueryKey,
      classroomId,
      memberId,
      "attendances",
      page,
    ] as const,
    queryFn: () => listMemberAttendances(classroomId, memberId, page),
  };
}
