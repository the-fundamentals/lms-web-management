import { describe, expect, it } from "vitest";
import { formatVnd } from "./vnd";

describe("formatVnd", () => {
  it("zero is Free", () => {
    expect(formatVnd(0)).toBe("Free");
  });

  it("formats whole VND with thousand separators", () => {
    expect(formatVnd(150000)).toBe("150,000 VND");
  });

  it("truncates fractional input", () => {
    expect(formatVnd(99.9)).toBe("99 VND");
  });
});
