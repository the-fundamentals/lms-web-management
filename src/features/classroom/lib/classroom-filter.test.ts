import { describe, expect, it } from "vitest";
import { classroomListFilter } from "./classroom-filter";

describe("classroomListFilter", () => {
  it("omits filters when search is blank", () => {
    expect(classroomListFilter("  ")).toEqual({ page: 0, size: 50 });
  });

  it("adds a name like filter for typed search", () => {
    expect(classroomListFilter("Algebra")).toEqual({
      page: 0,
      size: 50,
      filters: [{ field: "name", operator: "like", value: "Algebra" }],
    });
  });
});
