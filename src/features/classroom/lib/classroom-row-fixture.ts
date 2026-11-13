import type { ClassroomRow } from "./classroom-api";

/** Minimal ClassroomRow for unit tests. */
export function classroomRow(
  partial: Partial<ClassroomRow> & Pick<ClassroomRow, "id" | "name">,
): ClassroomRow {
  return {
    numberOfMembers: 0,
    status: "ACTIVE",
    createdDate: "2026-11-11T00:00:00.000Z",
    basePaymentPlanType: "PER_SESSION",
    basePaymentPlanAmount: 0,
    ...partial,
  };
}
