import { fieldError, type FieldError } from "@/shared/lib/screen-rules";
import { preserveTeacherText } from "@/shared/lib/text";

export const CLASSROOM_NAME_MAX = 255;

export type ClassroomNameOk = { name: string; ok: true };
export type ClassroomNameInvalid = { error: FieldError; ok: false };
export type ClassroomNameResult = ClassroomNameOk | ClassroomNameInvalid;

export function validateClassroomName(raw: string): ClassroomNameResult {
  const values = { name: raw };
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: fieldError(values, "name", "is required") };
  }
  if (trimmed.length > CLASSROOM_NAME_MAX) {
    return {
      ok: false,
      error: fieldError(values, "name", `must be at most ${CLASSROOM_NAME_MAX} characters`),
    };
  }
  return { ok: true, name: preserveTeacherText(trimmed) };
}
