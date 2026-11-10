import { describe, expect, it } from "vitest";
import { civilDateInGmt7, formatInstantInGmt7, gmt7Offset, instantFromGmt7 } from "./gmt7";

const dateChange = "2026-01-15T18:00:00Z";

describe("gmt7", () => {
  it("an instant is labeled GMT+7", () => {
    expect(formatInstantInGmt7(dateChange)).toContain("GMT+7");
  });

  it("00:00 UTC is 07:00 on the same calendar date", () => {
    expect(formatInstantInGmt7("2026-01-15T00:00:00Z")).toContain("2026-01-15 07:00");
  });

  it("18:00 UTC is 01:00 on the next calendar date", () => {
    expect(formatInstantInGmt7(dateChange)).toContain("2026-01-16 01:00");
    expect(instantFromGmt7("2026-01-16", "01:00")).toBe("2026-01-15T18:00:00.000Z");
  });

  it("the offset stays +07:00 in June and in December", () => {
    expect(gmt7Offset("2026-06-15T12:00:00Z")).toBe("+07:00");
    expect(gmt7Offset("2026-12-15T12:00:00Z")).toBe("+07:00");
  });

  it("civilDateInGmt7 returns the GMT+7 calendar date", () => {
    expect(civilDateInGmt7(dateChange)).toBe("2026-01-16");
  });
});
