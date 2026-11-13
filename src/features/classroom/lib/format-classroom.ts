import { formatMoneyDigits } from "@/shared/lib/money";
import type { ClassroomRow } from "./classroom-api";

export function formatClassroomPlan(classroom: ClassroomRow): string {
  if (classroom.basePaymentPlanAmount <= 0) return "Free";
  return `${formatMoneyDigits(String(classroom.basePaymentPlanAmount))} VND / session`;
}

export function formatClassroomCreated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatMemberCount(count: number): string {
  return count === 1 ? "1 member" : `${count} members`;
}
