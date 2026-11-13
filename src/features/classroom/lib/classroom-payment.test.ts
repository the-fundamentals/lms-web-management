import { describe, expect, it } from "vitest";
import { validateBasePaymentPlan } from "./classroom-payment";

describe("validateBasePaymentPlan", () => {
  it("blank amount becomes 0 free", () => {
    expect(validateBasePaymentPlan("", "PER_SESSION")).toEqual({
      ok: true,
      plan: { amount: 0, type: "PER_SESSION" },
    });
  });

  it("parses a whole-number amount", () => {
    expect(validateBasePaymentPlan("150000", "PER_SESSION")).toEqual({
      ok: true,
      plan: { amount: 150000, type: "PER_SESSION" },
    });
  });

  it("rejects non-integers", () => {
    const result = validateBasePaymentPlan("12.5", "PER_SESSION");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe("amount");
  });
});
