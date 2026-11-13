import { describe, expect, it } from "vitest";
import { headerTrailForPath } from "./header-trail";

describe("headerTrailForPath", () => {
  it("overview shows a single crumb and New classroom", () => {
    expect(headerTrailForPath("/")).toEqual({
      crumbs: [{ label: "Overview" }],
      showNewClassroom: true,
    });
  });

  it("classrooms list nests under Management", () => {
    expect(headerTrailForPath("/classrooms")).toEqual({
      crumbs: [{ label: "Management", to: "/" }, { label: "Classrooms" }],
      showNewClassroom: true,
    });
  });

  it("new classroom trail ends with New classroom and hides the CTA", () => {
    expect(headerTrailForPath("/classrooms/new")).toEqual({
      crumbs: [
        { label: "Management", to: "/" },
        { label: "Classrooms", to: "/classrooms" },
        { label: "New classroom" },
      ],
      showNewClassroom: false,
    });
  });

  it("detail uses pageLabel for the leaf crumb", () => {
    expect(headerTrailForPath("/classrooms/abc", "Algebra")).toEqual({
      crumbs: [
        { label: "Management", to: "/" },
        { label: "Classrooms", to: "/classrooms" },
        { label: "Algebra" },
      ],
      showNewClassroom: false,
    });
  });
});
