import { describe, expect, it } from "vitest";
import { CLASSROOM_NAME_MAX, validateClassroomName } from "./classroom-name";

describe("classroom name", () => {
  it("a trimmed name of 1–255 characters is valid", () => {
    const result = validateClassroomName("  Algebra  ");
    expect(result).toEqual({ ok: true, name: "Algebra" });
  });

  it("an empty string fails and names the name field", () => {
    const result = validateClassroomName("");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("name");
    expect(result.error.message.toLowerCase()).toContain("name");
    expect(result.error.values.name).toBe("");
  });

  it("whitespace-only fails and names the name field", () => {
    const result = validateClassroomName("   ");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("name");
    expect(result.error.message.toLowerCase()).toContain("name");
    expect(result.error.values.name).toBe("   ");
  });

  it("256 characters fail", () => {
    const tooLong = "a".repeat(CLASSROOM_NAME_MAX + 1);
    const result = validateClassroomName(tooLong);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("name");
  });
});
