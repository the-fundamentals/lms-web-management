import { getAllClassroomMembers } from "@/generated/sdk.gen";
import type { ClassroomMemberResponse } from "@/generated/types.gen";

/** Shared so Members + Money (+ classroom route warm) hit one React Query cache. */
export const classroomMembersQueryKey = ["classroom-members"] as const;

export type ClassroomMemberRow = {
  id: string;
  classroomId: string;
  accountId: string;
  role: ClassroomMemberResponse["role"];
  status: ClassroomMemberResponse["status"];
  email: string;
  name: string;
  avatar?: string;
};

export function mapClassroomMemberRow(
  member: ClassroomMemberResponse,
): ClassroomMemberRow {
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

export async function listClassroomMembers(
  classroomId: string,
): Promise<ClassroomMemberRow[]> {
  const result = await getAllClassroomMembers({
    path: { classroomId },
    throwOnError: true,
  });
  return (result.data ?? []).map(mapClassroomMemberRow);
}

export function classroomMembersQueryOptions(classroomId: string) {
  return {
    queryKey: [...classroomMembersQueryKey, classroomId] as const,
    queryFn: () => listClassroomMembers(classroomId),
  };
}
