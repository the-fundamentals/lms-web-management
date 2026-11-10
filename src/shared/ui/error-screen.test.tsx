import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorScreen } from "./error-screen";

describe("ErrorScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("the screen names what failed", () => {
    render(<ErrorScreen message="Classrooms failed" onRetry={vi.fn()} />);

    expect(screen.getByText("Classrooms failed")).toBeTruthy();
  });

  it("the screen offers a shadcn Button for retry", () => {
    render(<ErrorScreen message="Classrooms failed" onRetry={vi.fn()} />);

    const retry = screen.getByRole("button", { name: "Try again" });

    expect(retry.getAttribute("data-slot")).toBe("button");
  });

  it("retry calls the given function", () => {
    const onRetry = vi.fn();
    render(<ErrorScreen message="Classrooms failed" onRetry={onRetry} />);

    fireEvent.click(screen.getByTestId("error-screen-retry-button"));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("the failure text is present without relying on color", () => {
    render(<ErrorScreen message="Classrooms failed" onRetry={vi.fn()} />);

    expect(screen.getByText("Classrooms failed").textContent).toBe("Classrooms failed");
  });

  it("the screen renders the shadcn Alert and uses no hex value", () => {
    const { container } = render(<ErrorScreen message="Classrooms failed" onRetry={vi.fn()} />);

    expect(document.querySelector("[data-slot='alert']")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });
});
