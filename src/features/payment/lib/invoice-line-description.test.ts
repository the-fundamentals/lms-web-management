import { describe, expect, it } from "vitest";
import { parseInvoiceLineDescription } from "./invoice-line-description";

describe("parseInvoiceLineDescription", () => {
  it("returns plain text when there are no timestamps", () => {
    expect(parseInvoiceLineDescription("Private tutoring fee")).toEqual({
      kind: "plain",
      text: "Private tutoring fee",
    });
  });

  it("extracts and formats ISO timestamps in GMT+7", () => {
    const raw =
      "Attended dates: 2026-11-14T23:06:53.465975, 2026-11-15T01:14:55.107748";
    const view = parseInvoiceLineDescription(raw);
    expect(view.kind).toBe("attended");
    if (view.kind !== "attended") return;
    expect(view.label).toMatch(/Attended/i);
    // 23:06Z → 06:06 GMT+7 next civil day
    expect(view.stamps[0]).toBe("15 Nov 2026 · 06:06");
    // 01:14Z → 08:14 GMT+7 same civil day
    expect(view.stamps[1]).toBe("15 Nov 2026 · 08:14");
  });

  it("keeps plain text if stamps cannot be parsed", () => {
    expect(parseInvoiceLineDescription("Attended dates: 2026-99-99T99:99:99")).toEqual({
      kind: "plain",
      text: "Attended dates: 2026-99-99T99:99:99",
    });
  });
});
