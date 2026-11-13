import type { PaymentPlanType } from "@/generated/types.gen";
import { fieldError, type FieldError } from "@/shared/lib/screen-rules";

export const DEFAULT_PAYMENT_PLAN_TYPE: PaymentPlanType = "PER_SESSION";

export type PaymentPlanOk = {
  ok: true;
  plan: { amount: number; type: PaymentPlanType };
};
export type PaymentPlanInvalid = { error: FieldError; ok: false };
export type PaymentPlanResult = PaymentPlanOk | PaymentPlanInvalid;

/** Amount is smallest currency unit; blank → 0 (free). */
export function validateBasePaymentPlan(rawAmount: string, type: PaymentPlanType): PaymentPlanResult {
  const values = { amount: rawAmount, type };
  const trimmed = rawAmount.trim();
  if (trimmed.length === 0) {
    return { ok: true, plan: { amount: 0, type } };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: fieldError(values, "amount", "must be a whole number") };
  }
  const amount = Number(trimmed);
  if (!Number.isSafeInteger(amount) || amount < 0) {
    return { ok: false, error: fieldError(values, "amount", "must be zero or greater") };
  }
  return { ok: true, plan: { amount, type } };
}
