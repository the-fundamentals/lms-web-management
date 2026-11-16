import {
  cancelClassroomSession,
  completeClassroomSession,
  createClassroomScheduleRecurrence,
  createClassroomSession,
  createClassroomSessionAttendances,
  deleteClassroomScheduleRecurrence,
  getAllClassroomMembers,
  getAllClassroomScheduleRecurrences,
  getAllClassroomSessionAttendances,
  getAllClassroomSessions,
  getClassroomSessionById,
  updateClassroomSession,
  updateClassroomSessionAttendance,
} from "@/generated/sdk.gen";
import type {
  ClassroomMemberResponse,
  ClassroomScheduleRecurrenceResponse,
  ClassroomSessionAttendanceResponse,
  ClassroomSessionAttendanceStatus,
  ClassroomSessionCancelCause,
  ClassroomSessionFilter,
  ClassroomSessionResponse,
  CreateClassroomScheduleRecurrenceCommand,
  CreateClassroomSessionAdhocCommand,
  RecurrenceByDay,
  UpdateClassroomSessionCommand,
} from "@/generated/types.gen";
import { queryClient } from "@/shared/api/query-client";
import { clockHm } from "./session-time";

export const sessionsQueryKey = ["classroom-sessions"] as const;
export const recurrencesQueryKey = ["classroom-recurrences"] as const;

/** Refetch active + inactive calendar/list (and detail) queries for a classroom. */
export async function invalidateClassroomSessions(classroomId: string): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: [...sessionsQueryKey, classroomId],
    refetchType: "all",
  });
}

export async function invalidateClassroomRecurrences(classroomId: string): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: [...recurrencesQueryKey, classroomId],
    refetchType: "all",
  });
}

export type SessionRow = {
  id: string;
  classroomId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: ClassroomSessionResponse["status"];
  type: ClassroomSessionResponse["type"];
  /** Present when status is CANCELLED (MANUAL | REMOVED_FROM_SERIES). */
  cancelCause?: ClassroomSessionCancelCause;
  name?: string;
  description?: string;
};

export type RecurrenceRow = {
  id: string;
  classroomId: string;
  byDay: RecurrenceByDay;
  recurrenceStartDate: string;
  recurUntil?: string;
  startTime: string;
  endTime: string;
  name?: string;
};

export type AttendanceRow = {
  id: string;
  sessionId: string;
  classroomMemberId: string;
  status: ClassroomSessionAttendanceStatus;
  attendanceDate?: string;
};

export type MemberPick = {
  id: string;
  accountId: string;
  name: string;
  email: string;
  status: ClassroomMemberResponse["status"];
  /** Denormalized avatar key from the account profile when present. */
  avatar?: string;
};

export function mapSessionRow(session: ClassroomSessionResponse): SessionRow {
  return {
    id: session.id,
    classroomId: session.classroomId,
    sessionDate: session.sessionDate,
    startTime: session.startTime,
    endTime: session.endTime,
    status: session.status,
    type: session.type,
    ...(session.cancelCause ? { cancelCause: session.cancelCause } : {}),
    ...(session.name ? { name: session.name } : {}),
    ...(session.description ? { description: session.description } : {}),
  };
}

export function mapRecurrenceRow(
  row: ClassroomScheduleRecurrenceResponse,
): RecurrenceRow {
  return {
    id: row.id,
    classroomId: row.classroomId,
    byDay: row.byDay,
    recurrenceStartDate: row.recurrenceStartDate,
    startTime: row.startTime,
    endTime: row.endTime,
    ...(row.recurUntil ? { recurUntil: row.recurUntil } : {}),
    ...(row.name ? { name: row.name } : {}),
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
    ...(row.attendanceDate ? { attendanceDate: row.attendanceDate } : {}),
  };
}

export function createSessionBody(input: {
  sessionDate: string;
  startTime: string;
  endTime: string;
  name?: string;
}): CreateClassroomSessionAdhocCommand {
  const body: CreateClassroomSessionAdhocCommand = {
    sessionDate: input.sessionDate,
    startTime: `${clockHm(input.startTime)}:00`,
    endTime: `${clockHm(input.endTime)}:00`,
  };
  if (input.name?.trim()) body.name = input.name.trim();
  return body;
}

export function createRecurrenceBody(input: {
  byDays: RecurrenceByDay[];
  recurrenceStartDate: string;
  startTime: string;
  endTime: string;
  recurUntil?: string;
  name?: string;
}): CreateClassroomScheduleRecurrenceCommand {
  const body: CreateClassroomScheduleRecurrenceCommand = {
    frequency: "WEEKLY",
    byDays: input.byDays,
    recurrenceStartDate: input.recurrenceStartDate,
    startTime: `${clockHm(input.startTime)}:00`,
    endTime: `${clockHm(input.endTime)}:00`,
  };
  if (input.recurUntil) body.recurUntil = input.recurUntil;
  if (input.name?.trim()) body.name = input.name.trim();
  return body;
}

/**
 * Body for PUT updateClassroomSession.
 * Date/time fields are ADHOC-only on the API (SCHEDULE rejects them).
 * Omitted name/description clear those fields — callers must pass current values to keep them.
 */
export function updateSessionBody(input: {
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  name?: string | null;
  description?: string | null;
}): UpdateClassroomSessionCommand {
  const body: UpdateClassroomSessionCommand = {};
  if (input.sessionDate !== undefined) body.sessionDate = input.sessionDate;
  if (input.startTime !== undefined) body.startTime = `${clockHm(input.startTime)}:00`;
  if (input.endTime !== undefined) body.endTime = `${clockHm(input.endTime)}:00`;
  if (input.name !== undefined) {
    body.name = input.name === null || input.name.trim() === "" ? undefined : input.name.trim();
  }
  if (input.description !== undefined) {
    body.description =
      input.description === null || input.description.trim() === ""
        ? undefined
        : input.description.trim();
  }
  return body;
}

/** Attendance create/update sends status only (FR4.6). */
export function attendanceStatusBody(status: "ATTENDED" | "ABSENT") {
  return { status };
}

export type SessionDateRange = { from: string; to: string };

// API Max on ClassroomSessionFilter.size is 50 (lms-core-api).
export const defaultSessionListFilter: ClassroomSessionFilter = {
  page: 0,
  size: 50,
  sortBy: "startTime",
  sortDirection: "ASC",
};

/** Query body with optional inclusive sessionDate gte/lte window. */
export function sessionListFilter(range?: SessionDateRange): ClassroomSessionFilter {
  if (!range) return { ...defaultSessionListFilter };
  return {
    ...defaultSessionListFilter,
    filters: [
      { field: "sessionDate", operator: "gte", value: range.from },
      { field: "sessionDate", operator: "lte", value: range.to },
    ],
  };
}

export async function listSessions(
  classroomId: string,
  range?: SessionDateRange,
): Promise<SessionRow[]> {
  // Always send sessionDate gte/lte on the request — API uses them to generate
  // missing SCHEDULE rows for that window (lms-core-api PATCHWORK).
  const result = await getAllClassroomSessions({
    path: { classroomId },
    body: sessionListFilter(range),
    throwOnError: true,
  });
  const rows = (result.data ?? []).map(mapSessionRow);
  // BaseQuery currently drops filter conditions from the list query; keep the
  // UI honest by applying the same inclusive civil window client-side.
  if (!range) return rows;
  return rows.filter(
    (row) => row.sessionDate >= range.from && row.sessionDate <= range.to,
  );
}

export async function fetchSession(
  classroomId: string,
  sessionId: string,
): Promise<SessionRow> {
  const result = await getClassroomSessionById({
    path: { classroomId, sessionId },
    throwOnError: true,
  });
  return mapSessionRow(result.data);
}

export async function createSession(
  classroomId: string,
  input: { sessionDate: string; startTime: string; endTime: string; name?: string },
): Promise<SessionRow> {
  const result = await createClassroomSession({
    path: { classroomId },
    body: createSessionBody(input),
    throwOnError: true,
  });
  await invalidateClassroomSessions(classroomId);
  return mapSessionRow(result.data);
}

export async function completeSession(classroomId: string, sessionId: string): Promise<SessionRow> {
  const result = await completeClassroomSession({
    path: { classroomId, sessionId },
    throwOnError: true,
  });
  await invalidateClassroomSessions(classroomId);
  return mapSessionRow(result.data);
}

export async function cancelSession(classroomId: string, sessionId: string): Promise<SessionRow> {
  const result = await cancelClassroomSession({
    path: { classroomId, sessionId },
    throwOnError: true,
  });
  await invalidateClassroomSessions(classroomId);
  return mapSessionRow(result.data);
}

export async function updateSession(
  classroomId: string,
  sessionId: string,
  input: {
    sessionDate?: string;
    startTime?: string;
    endTime?: string;
    name?: string | null;
    description?: string | null;
  },
): Promise<SessionRow> {
  const result = await updateClassroomSession({
    path: { classroomId, sessionId },
    body: updateSessionBody(input),
    throwOnError: true,
  });
  await invalidateClassroomSessions(classroomId);
  return mapSessionRow(result.data);
}

export async function listRecurrences(classroomId: string): Promise<RecurrenceRow[]> {
  const result = await getAllClassroomScheduleRecurrences({
    path: { classroomId },
    throwOnError: true,
  });
  return (result.data ?? [])
    .filter((row) => !row.deletedDate)
    .map(mapRecurrenceRow);
}

export async function createRecurrence(
  classroomId: string,
  input: {
    byDays: RecurrenceByDay[];
    recurrenceStartDate: string;
    startTime: string;
    endTime: string;
    recurUntil?: string;
    name?: string;
  },
): Promise<RecurrenceRow[]> {
  const result = await createClassroomScheduleRecurrence({
    path: { classroomId },
    body: createRecurrenceBody(input),
    throwOnError: true,
  });
  // Recurrence create may materialize SCHEDULE sessions — refresh both caches.
  await Promise.all([
    invalidateClassroomRecurrences(classroomId),
    invalidateClassroomSessions(classroomId),
  ]);
  return (result.data ?? []).map(mapRecurrenceRow);
}

/** Body for truncating a recurrence from cutoffDate onward (OPEN sessions cancelled). */
export function deleteRecurrenceBody(cutoffDate: string): {
  cutoffDate: string;
} {
  return { cutoffDate };
}

export async function deleteRecurrence(
  classroomId: string,
  scheduleId: string,
  cutoffDate: string,
): Promise<void> {
  await deleteClassroomScheduleRecurrence({
    path: { classroomId, scheduleId },
    body: deleteRecurrenceBody(cutoffDate),
    throwOnError: true,
  });
  await Promise.all([
    invalidateClassroomRecurrences(classroomId),
    invalidateClassroomSessions(classroomId),
  ]);
}

export async function listSessionAttendances(
  classroomId: string,
  sessionId: string,
): Promise<AttendanceRow[]> {
  const result = await getAllClassroomSessionAttendances({
    path: { classroomId, sessionId },
    throwOnError: true,
  });
  return (result.data ?? []).map(mapAttendanceRow);
}

export async function saveAttendanceStatuses(
  classroomId: string,
  sessionId: string,
  marks: Array<{ classroomMemberId: string; status: "ATTENDED" | "ABSENT"; existingId?: string }>,
): Promise<AttendanceRow[]> {
  const toCreate = marks.filter((m) => !m.existingId);
  const toUpdate = marks.filter((m) => m.existingId);
  const created =
    toCreate.length > 0
      ? await createClassroomSessionAttendances({
          path: { classroomId, sessionId },
          body: {
            attendances: toCreate.map((m) => ({
              classroomMemberId: m.classroomMemberId,
              status: m.status,
            })),
          },
          throwOnError: true,
        })
      : { data: [] as ClassroomSessionAttendanceResponse[] };
  for (const mark of toUpdate) {
    await updateClassroomSessionAttendance({
      path: {
        classroomId,
        sessionId,
        attendanceId: mark.existingId!,
      },
      body: attendanceStatusBody(mark.status),
      throwOnError: true,
    });
  }
  if (toUpdate.length > 0) {
    return listSessionAttendances(classroomId, sessionId);
  }
  return (created.data ?? []).map(mapAttendanceRow);
}

export async function listActiveMembersForAttendance(
  classroomId: string,
): Promise<MemberPick[]> {
  const result = await getAllClassroomMembers({
    path: { classroomId },
    throwOnError: true,
  });
  return (result.data ?? [])
    .filter((m) => m.status === "ACTIVE")
    .map((m) => ({
      id: m.id,
      accountId: m.accountId,
      name: m.name,
      email: m.email,
      status: m.status,
      ...(m.avatar ? { avatar: m.avatar } : {}),
    }));
}

export function sessionsQueryOptions(classroomId: string, range?: SessionDateRange) {
  const from = range?.from ?? "";
  const to = range?.to ?? "";
  const window = from && to ? { from, to } : undefined;
  return {
    queryKey: [...sessionsQueryKey, classroomId, "range", from, to] as const,
    queryFn: () => listSessions(classroomId, window),
  };
}

export function recurrencesQueryOptions(classroomId: string) {
  return {
    queryKey: [...recurrencesQueryKey, classroomId] as const,
    queryFn: () => listRecurrences(classroomId),
  };
}

export function sessionQueryOptions(classroomId: string, sessionId: string) {
  return {
    queryKey: [...sessionsQueryKey, classroomId, sessionId] as const,
    queryFn: () => fetchSession(classroomId, sessionId),
  };
}

export function sessionAttendancesQueryOptions(classroomId: string, sessionId: string) {
  return {
    queryKey: [...sessionsQueryKey, classroomId, sessionId, "attendances"] as const,
    queryFn: () => listSessionAttendances(classroomId, sessionId),
  };
}
