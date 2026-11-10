import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LoadingScreen } from "./loading-screen";

describe("LoadingScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("the screen says it is loading", () => {
    render(<LoadingScreen />);

    expect(screen.getByRole("status").textContent).toMatch(/loading/i);
  });

  it("the loading text is present without relying on color", () => {
    render(<LoadingScreen />);

    const text = screen.getByText("Loading");

    expect(text.textContent).toBe("Loading");
  });

  it("the screen renders the shadcn Skeleton", () => {
    render(<LoadingScreen />);

    expect(document.querySelector("[data-slot='skeleton']")).not.toBeNull();
  });

  it("the screen uses a semantic color class and no hex value", () => {
    const { container } = render(<LoadingScreen />);

    expect(container.innerHTML).toContain("bg-background");
    expect(container.innerHTML).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("retry is not shown on the loading screen", () => {
    render(<LoadingScreen />);

    expect(screen.queryByRole("button", { name: /try again|retry/i })).toBeNull();
  });
});
