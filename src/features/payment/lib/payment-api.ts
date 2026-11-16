import {
  approveClassroomInvoice,
  cancelClassroomInvoice,
  completeClassroomInvoice,
  createClassroomInvoiceAdhoc,
  createClassroomMemberPaymentPlan,
  getAllClassroomPaymentPlans,
  getClassroomById,
  getClassroomInvoiceById,
  queryClassroomInvoices,
  setClassroomBasePaymentPlan,
} from "@/generated/sdk.gen";
import type {
  ClassroomInvoiceFilter,
  ClassroomInvoiceLineKind,
  ClassroomInvoicePaymentMethod,
  ClassroomInvoiceResponse,
  ClassroomInvoiceStatus,
  ClassroomInvoiceType,
  ClassroomMemberPaymentPlanResponse,
  ClassroomResponse,
  CompleteClassroomInvoiceCommand,
  CreateClassroomInvoiceAdhocCommand,
  CreateClassroomInvoiceAdhocLineCommand,
  CreateClassroomMemberPaymentPlanCommand,
  SetClassroomBasePaymentPlanCommand,
} from "@/generated/types.gen";
import type { ClassroomMemberRow } from "@/shared/api/classroom-members";
import { queryClient } from "@/shared/api/query-client";

export const paymentPlansQueryKey = ["classroom-payment-plans"] as const;
export const invoicesQueryKey = ["classroom-invoices"] as const;
export const classroomMoneyQueryKey = ["classroom-money"] as const;

export type InvoiceRow = {
  id: string;
  classroomId: string;
  memberId: string;
  status: ClassroomInvoiceStatus;
  type: ClassroomInvoiceType;
  /** Civil `YYYY-MM-DD` — GENERATED billing window start; omitted on ADHOC. */
  billingStart?: string;
  /** Civil `YYYY-MM-DD` — GENERATED billing window end; omitted on ADHOC. */
  billingEnd?: string;
  totalAmount: number;
  note?: string;
  approvedAt?: string;
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: ClassroomInvoicePaymentMethod;
  paymentReference?: string;
  paymentNote?: string;
  lines: ClassroomInvoiceResponse["lines"];
  createdDate: string;
  lastModifiedDate: string;
};

export type MemberPick = {
  id: string;
  accountId: string;
  name: string;
  email: string;
  role: ClassroomMemberRow["role"];
  status: ClassroomMemberRow["status"];
};

export type PaymentPlanRow = {
  id: string;
  classroomMemberId: string;
  amount: number;
  type: ClassroomMemberPaymentPlanResponse["type"];
  effectiveFrom: string;
  /** True when plan tracks classroom base (API `fromClassroomBase`). */
  fromClassroomBase: boolean;
};

export type ClassroomMoneyRow = {
  id: string;
  basePaymentPlanAmount: number;
  basePaymentPlanType: ClassroomResponse["basePaymentPlanType"];
};

/** Default invoice query: classroom-scoped via path; drafts included. */
export const defaultInvoiceListFilter: ClassroomInvoiceFilter = {
  page: 0,
  size: 50,
  sortBy: "createdDate",
  sortDirection: "DESC",
};

export function setClassroomBaseBody(amount: number): SetClassroomBasePaymentPlanCommand {
  return { amount, type: "PER_SESSION" };
}

export function createStudentPlanBody(amount: number): CreateClassroomMemberPaymentPlanCommand {
  return { type: "PER_SESSION", amount };
}

export function completeInvoiceBody(input: {
  paidAmount: number;
  paymentMethod: ClassroomInvoicePaymentMethod;
}): CompleteClassroomInvoiceCommand {
  return {
    paidAmount: input.paidAmount,
    paymentMethod: input.paymentMethod,
  };
}

export function createAdhocInvoiceBody(input: {
  memberId: string;
  note?: string;
  lines: Array<{
    kind: ClassroomInvoiceLineKind;
    description: string;
    unitPrice: number;
    quantity: number;
  }>;
}): CreateClassroomInvoiceAdhocCommand {
  if (input.lines.length < 1) {
    throw new Error("At least one invoice line is required");
  }
  const lines: CreateClassroomInvoiceAdhocLineCommand[] = input.lines.map((line) => ({
    kind: line.kind,
    description: line.description,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
  }));
  const body: CreateClassroomInvoiceAdhocCommand = {
    memberId: input.memberId,
    lines,
  };
  if (input.note?.trim()) body.note = input.note.trim();
  return body;
}

/** Missing current plan → 0 VND for display (FR5.4); never copy classroom base. */
export function currentPlanAmount(
  plansByMemberId: Map<string, number>,
  memberId: string,
): number {
  return plansByMemberId.get(memberId) ?? 0;
}

export function mapInvoiceRow(invoice: ClassroomInvoiceResponse): InvoiceRow {
  return {
    id: invoice.id,
    classroomId: invoice.classroomId,
    memberId: invoice.memberId,
    status: invoice.status,
    type: invoice.type,
    totalAmount: invoice.totalAmount,
    lines: invoice.lines,
    createdDate: invoice.createdDate,
    lastModifiedDate: invoice.lastModifiedDate,
    ...(invoice.billingStart ? { billingStart: invoice.billingStart } : {}),
    ...(invoice.billingEnd ? { billingEnd: invoice.billingEnd } : {}),
    ...(invoice.note ? { note: invoice.note } : {}),
    ...(invoice.approvedAt ? { approvedAt: invoice.approvedAt } : {}),
    ...(invoice.paidAt ? { paidAt: invoice.paidAt } : {}),
    ...(invoice.paidAmount !== undefined ? { paidAmount: invoice.paidAmount } : {}),
    ...(invoice.paymentMethod ? { paymentMethod: invoice.paymentMethod } : {}),
    ...(invoice.paymentReference ? { paymentReference: invoice.paymentReference } : {}),
    ...(invoice.paymentNote ? { paymentNote: invoice.paymentNote } : {}),
  };
}

export function mapMemberPick(member: ClassroomMemberRow): MemberPick {
  return {
    id: member.id,
    accountId: member.accountId,
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
  };
}

/** ACTIVE students only — Money pricing / invoice create. */
export function activeStudents(members: ClassroomMemberRow[]): MemberPick[] {
  return members
    .filter((m) => m.status === "ACTIVE" && m.role === "STUDENT")
    .map(mapMemberPick);
}

export function mapPaymentPlanRow(
  plan: ClassroomMemberPaymentPlanResponse,
): PaymentPlanRow {
  return {
    id: plan.id,
    classroomMemberId: plan.classroomMemberId,
    amount: plan.amount,
    type: plan.type,
    effectiveFrom: plan.effectiveFrom,
    fromClassroomBase: plan.fromClassroomBase,
  };
}

export async function invalidateClassroomMoney(classroomId: string): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: [...classroomMoneyQueryKey, classroomId],
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: [...paymentPlansQueryKey, classroomId],
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: [...invoicesQueryKey, classroomId],
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: ["classroom", classroomId],
      refetchType: "all",
    }),
  ]);
}

export async function fetchClassroomMoney(classroomId: string): Promise<ClassroomMoneyRow> {
  const result = await getClassroomById({
    path: { id: classroomId },
    throwOnError: true,
  });
  const classroom = result.data;
  return {
    id: classroom.id,
    basePaymentPlanAmount: classroom.basePaymentPlanAmount,
    basePaymentPlanType: classroom.basePaymentPlanType,
  };
}

export async function setClassroomPrice(
  classroomId: string,
  amount: number,
): Promise<ClassroomMoneyRow> {
  const result = await setClassroomBasePaymentPlan({
    path: { classroomId },
    body: setClassroomBaseBody(amount),
    throwOnError: true,
  });
  await invalidateClassroomMoney(classroomId);
  return {
    id: result.data.id,
    basePaymentPlanAmount: result.data.basePaymentPlanAmount,
    basePaymentPlanType: result.data.basePaymentPlanType,
  };
}

export async function listCurrentPaymentPlans(
  classroomId: string,
): Promise<PaymentPlanRow[]> {
  const result = await getAllClassroomPaymentPlans({
    path: { classroomId },
    throwOnError: true,
  });
  return (result.data ?? []).map(mapPaymentPlanRow);
}

export async function setStudentPrice(
  classroomId: string,
  memberId: string,
  amount: number,
): Promise<PaymentPlanRow> {
  const result = await createClassroomMemberPaymentPlan({
    path: { classroomId, memberId },
    body: createStudentPlanBody(amount),
    throwOnError: true,
  });
  await invalidateClassroomMoney(classroomId);
  return mapPaymentPlanRow(result.data);
}

export async function listInvoices(
  classroomId: string,
  filter: ClassroomInvoiceFilter = defaultInvoiceListFilter,
): Promise<InvoiceRow[]> {
  const result = await queryClassroomInvoices({
    path: { classroomId },
    body: filter,
    throwOnError: true,
  });
  return (result.data ?? []).map(mapInvoiceRow);
}

export async function fetchInvoice(
  classroomId: string,
  invoiceId: string,
): Promise<InvoiceRow> {
  const result = await getClassroomInvoiceById({
    path: { classroomId, invoiceId },
    throwOnError: true,
  });
  return mapInvoiceRow(result.data);
}

export async function createAdhocInvoice(
  classroomId: string,
  input: {
    memberId: string;
    note?: string;
    lines: Array<{
      kind: ClassroomInvoiceLineKind;
      description: string;
      unitPrice: number;
      quantity: number;
    }>;
  },
): Promise<InvoiceRow> {
  const result = await createClassroomInvoiceAdhoc({
    path: { classroomId },
    body: createAdhocInvoiceBody(input),
    throwOnError: true,
  });
  await invalidateClassroomMoney(classroomId);
  return mapInvoiceRow(result.data);
}

export async function approveInvoice(
  classroomId: string,
  invoiceId: string,
): Promise<InvoiceRow> {
  const result = await approveClassroomInvoice({
    path: { classroomId, invoiceId },
    throwOnError: true,
  });
  await invalidateClassroomMoney(classroomId);
  return mapInvoiceRow(result.data);
}

export async function completeInvoice(
  classroomId: string,
  invoiceId: string,
  input: { paidAmount: number; paymentMethod: ClassroomInvoicePaymentMethod },
): Promise<InvoiceRow> {
  const result = await completeClassroomInvoice({
    path: { classroomId, invoiceId },
    body: completeInvoiceBody(input),
    throwOnError: true,
  });
  await invalidateClassroomMoney(classroomId);
  return mapInvoiceRow(result.data);
}

export async function cancelInvoice(
  classroomId: string,
  invoiceId: string,
): Promise<InvoiceRow> {
  const result = await cancelClassroomInvoice({
    path: { classroomId, invoiceId },
    throwOnError: true,
  });
  await invalidateClassroomMoney(classroomId);
  return mapInvoiceRow(result.data);
}
