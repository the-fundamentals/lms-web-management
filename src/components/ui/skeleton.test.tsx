import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  afterEach(() => {
    cleanup();
  });

  it("the skeleton renders", () => {
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild).not.toBeNull();
  });

  it("the skeleton exposes the shadcn slot", () => {
    render(<Skeleton />);

    expect(document.querySelector("[data-slot='skeleton']")).not.toBeNull();
  });

  it("the markup uses a semantic color class", () => {
    render(<Skeleton />);

    expect(document.querySelector("[data-slot='skeleton']")?.className).toContain("bg-accent");
  });

  it("the markup contains no hex color", () => {
    const { container } = render(<Skeleton />);

    expect(container.innerHTML).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("the skeleton is not a button", () => {
    render(<Skeleton />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});
