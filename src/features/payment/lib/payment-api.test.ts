import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeInvoiceBody,
  createAdhocInvoiceBody,
  createStudentPlanBody,
  currentPlanAmount,
  defaultInvoiceListFilter,
  setClassroomBaseBody,
} from "./payment-api";

vi.mock("@/generated/sdk.gen", () => ({
  approveClassroomInvoice: vi.fn(),
  cancelClassroomInvoice: vi.fn(),
  completeClassroomInvoice: vi.fn(),
  createClassroomInvoiceAdhoc: vi.fn(),
  createClassroomMemberPaymentPlan: vi.fn(),
  getAllClassroomMembers: vi.fn(),
  getAllClassroomPaymentPlans: vi.fn(),
  getClassroomById: vi.fn(),
  getClassroomInvoiceById: vi.fn(),
  queryClassroomInvoices: vi.fn(),
  setClassroomBasePaymentPlan: vi.fn(),
  // Intentionally not generating invoices — helpers must never call this.
  generateClassroomInvoices: vi.fn(),
}));

vi.mock("@/shared/api/query-client", () => ({
  queryClient: { invalidateQueries: vi.fn(async () => undefined) },
}));

describe("payment api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("set classroom base body is PER_SESSION + amount", () => {
    expect(setClassroomBaseBody(150000)).toEqual({
      amount: 150000,
      type: "PER_SESSION",
    });
  });

  it("student plan create body is PER_SESSION + amount", () => {
    expect(createStudentPlanBody(0)).toEqual({ type: "PER_SESSION", amount: 0 });
  });

  it("missing current plan displays as 0", () => {
    const plans = new Map<string, number>([["m1", 100000]]);
    expect(currentPlanAmount(plans, "m1")).toBe(100000);
    expect(currentPlanAmount(plans, "missing")).toBe(0);
  });

  it("invoice query defaults page/size", () => {
    expect(defaultInvoiceListFilter.page).toBe(0);
    expect(defaultInvoiceListFilter.size).toBe(50);
  });

  it("adhoc create requires member + at least one line", () => {
    expect(() =>
      createAdhocInvoiceBody({ memberId: "m1", lines: [] }),
    ).toThrow(/at least one/i);
    expect(
      createAdhocInvoiceBody({
        memberId: "m1",
        lines: [{ kind: "OTHER", description: "Fee", unitPrice: 1000, quantity: 1 }],
      }),
    ).toEqual({
      memberId: "m1",
      lines: [{ kind: "OTHER", description: "Fee", unitPrice: 1000, quantity: 1 }],
    });
  });

  it("complete body includes paidAmount and BANK|CASH|OTHER", () => {
    expect(completeInvoiceBody({ paidAmount: 5000, paymentMethod: "BANK" })).toEqual({
      paidAmount: 5000,
      paymentMethod: "BANK",
    });
    expect(completeInvoiceBody({ paidAmount: 0, paymentMethod: "CASH" }).paymentMethod).toBe(
      "CASH",
    );
    expect(completeInvoiceBody({ paidAmount: 1, paymentMethod: "OTHER" }).paymentMethod).toBe(
      "OTHER",
    );
  });

  it("helpers never expose generateClassroomInvoices", async () => {
    const api = await import("./payment-api");
    expect("generateClassroomInvoices" in api).toBe(false);
    const sdk = await import("@/generated/sdk.gen");
    expect(vi.mocked(sdk.generateClassroomInvoices)).not.toHaveBeenCalled();
  });
});
