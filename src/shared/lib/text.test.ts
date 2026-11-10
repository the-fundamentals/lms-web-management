import { describe, expect, it } from "vitest";
import { preserveTeacherText } from "./text";

describe("text", () => {
  it("ASCII text is unchanged", () => {
    expect(preserveTeacherText("Morning class")).toBe("Morning class");
  });

  it("Vietnamese text with diacritics is unchanged", () => {
    expect(preserveTeacherText("Nguyễn")).toBe("Nguyễn");
  });

  it("an empty string stays empty", () => {
    expect(preserveTeacherText("")).toBe("");
  });

  it("leading and trailing spaces stay", () => {
    expect(preserveTeacherText(" Nguyễn ")).toBe(" Nguyễn ");
  });

  it("a string of only spaces stays", () => {
    expect(preserveTeacherText("   ")).toBe("   ");
  });
});
