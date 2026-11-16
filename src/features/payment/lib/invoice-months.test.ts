import { describe, expect, it } from "vitest";
import {
  groupInvoicesByMonth,
  invoiceBillingMonthLabel,
  invoiceBillingWindowLabel,
  invoiceCreatedDayLabel,
  invoiceGroupingMonthKey,
  invoiceMonthKeyFromInstant,
  invoiceMonthLabel,
  invoiceRowMeta,
} from "./invoice-months";
import type { InvoiceRow } from "./payment-api";

function invoice(
  partial: Partial<InvoiceRow> & Pick<InvoiceRow, "id" | "createdDate">,
): InvoiceRow {
  return {
    classroomId: "c1",
    memberId: "m1",
    status: "DRAFT",
    type: "ADHOC",
    totalAmount: 1000,
    lines: [],
    lastModifiedDate: partial.createdDate,
    ...partial,
  };
}

describe("invoice months", () => {
  it("keys createdDate by GMT+7 civil month", () => {
    // 2026-10-31 20:00Z → 2026-11-01 03:00 GMT+7
    expect(invoiceMonthKeyFromInstant("2026-10-31T20:00:00.000Z")).toBe("2026-11");
    expect(invoiceMonthLabel("2026-11")).toBe("November 2026");
    expect(invoiceCreatedDayLabel("2026-10-31T20:00:00.000Z")).toBe("1 Nov");
  });

  it("GENERATED groups and labels by billing window", () => {
    const generated = invoice({
      id: "g1",
      type: "GENERATED",
      billingStart: "2026-10-01",
      billingEnd: "2026-11-01",
      createdDate: "2026-11-05T00:00:00.000Z",
    });
    expect(invoiceGroupingMonthKey(generated)).toBe("2026-10");
    expect(invoiceBillingMonthLabel("2026-10-01")).toBe("Oct 2026");
    expect(invoiceBillingWindowLabel("2026-10-01", "2026-11-01")).toBe(
      "1 Oct 2026 – 1 Nov 2026",
    );
    expect(invoiceRowMeta(generated)).toBe("1 Oct 2026 – 1 Nov 2026");
  });

  it("ADHOC meta uses created day; groups newest month first", () => {
    const groups = groupInvoicesByMonth([
      invoice({ id: "a", createdDate: "2026-09-15T00:00:00.000Z" }),
      invoice({
        id: "b",
        type: "GENERATED",
        billingStart: "2026-11-01",
        billingEnd: "2026-12-01",
        createdDate: "2026-12-01T00:00:00.000Z",
      }),
      invoice({ id: "c", createdDate: "2026-11-10T00:00:00.000Z" }),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["2026-11", "2026-09"]);
    expect(groups[0]!.invoices.map((i) => i.id)).toEqual(["b", "c"]);
    expect(invoiceRowMeta(invoice({ id: "a", createdDate: "2026-09-15T00:00:00.000Z" }))).toBe(
      "15 Sep",
    );
  });
});
