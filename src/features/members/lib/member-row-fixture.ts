import type { AccountRow, AttendanceRow, MemberRow } from "./member-api";

export function memberRow(partial: Partial<MemberRow> & Pick<MemberRow, "id">): MemberRow {
  return {
    accountId: `acc-${partial.id}`,
    classroomId: "c1",
    email: `${partial.id}@example.com`,
    name: partial.name ?? `Member ${partial.id}`,
    role: "STUDENT",
    status: "ACTIVE",
    ...partial,
  };
}

export function accountRow(partial: Partial<AccountRow> & Pick<AccountRow, "id">): AccountRow {
  return {
    email: `${partial.id}@example.com`,
    firstName: "Ann",
    lastName: partial.id,
    ...partial,
  };
}

export function attendanceRow(
  partial: Partial<AttendanceRow> & Pick<AttendanceRow, "id">,
): AttendanceRow {
  return {
    classroomMemberId: "m1",
    createdDate: "2026-11-12T00:00:00.000Z",
    sessionId: `s-${partial.id}`,
    status: "ATTENDED",
    attendanceDate: "2026-11-12",
    ...partial,
  };
}
