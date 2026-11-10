import { describe, expect, it } from "vitest";
import { fieldError, partialFailure } from "./screen-rules";

describe("screen-rules", () => {
  it("fieldError names the field", () => {
    const result = fieldError({ name: "" }, "name", "is required");

    expect(result.field).toBe("name");
    expect(result.message).toContain("name");
  });

  it("fieldError keeps the other typed values", () => {
    const values = { name: "Room A", note: "Nguyễn" };

    const result = fieldError(values, "name", "is too long");

    expect(result.values.note).toBe("Nguyễn");
    expect(values.note).toBe("Nguyễn");
  });

  it("fieldError on an empty name keeps the rest of the form", () => {
    const values = { name: "", price: "10" };

    const result = fieldError(values, "name", "is required");

    expect(result.values.name).toBe("");
    expect(result.values.price).toBe("10");
    expect(values.price).toBe("10");
  });

  it("partialFailure returns the loaded part", () => {
    const loaded = { sessions: ["s1"] };

    const result = partialFailure(loaded, "invoices");

    expect(result.loaded).toEqual({ sessions: ["s1"] });
  });

  it("partialFailure names the failed part and does not replace the loaded part with a total", () => {
    const loaded = { sessions: ["s1", "s2"] };

    const result = partialFailure(loaded, "invoices");

    expect(result.failedPart).toBe("invoices");
    expect(result.loaded).toEqual({ sessions: ["s1", "s2"] });
    expect(result).not.toHaveProperty("total");
  });
});
