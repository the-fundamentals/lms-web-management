import { describe, expect, it } from "vitest";
import { formatMoneyDigits, parseMoneyDigits } from "./money";

describe("money helpers", () => {
  it("parseMoneyDigits strips non-digits and leading zeros", () => {
    expect(parseMoneyDigits("1,500,000 VND")).toBe("1500000");
    expect(parseMoneyDigits("")).toBe("");
    expect(parseMoneyDigits("0")).toBe("0");
    expect(parseMoneyDigits("0123123123")).toBe("123123123");
  });

  it("formatMoneyDigits groups by thousands without a leading-zero group", () => {
    expect(formatMoneyDigits("0")).toBe("0");
    expect(formatMoneyDigits("1500000")).toBe("1,500,000");
    expect(formatMoneyDigits("0123123123")).toBe("123,123,123");
    expect(formatMoneyDigits("")).toBe("");
  });
});
