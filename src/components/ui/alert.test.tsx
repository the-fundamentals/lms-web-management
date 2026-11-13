import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Alert, AlertDescription } from "./alert";

describe("Alert", () => {
  afterEach(() => {
    cleanup();
  });

  it("the alert shows its text", () => {
    render(
      <Alert>
        <AlertDescription>Classrooms failed</AlertDescription>
      </Alert>,
    );

    expect(screen.getByRole("alert").textContent).toContain("Classrooms failed");
  });

  it("the text is present without relying on color", () => {
    render(
      <Alert>
        <AlertDescription>Classrooms failed</AlertDescription>
      </Alert>,
    );

    expect(screen.getByText("Classrooms failed").textContent).toBe("Classrooms failed");
  });

  it("the alert uses a semantic color class", () => {
    render(
      <Alert>
        <AlertDescription>Classrooms failed</AlertDescription>
      </Alert>,
    );

    expect(screen.getByRole("alert").className).toContain("bg-card");
  });

  it("the markup contains no hex color", () => {
    const { container } = render(
      <Alert>
        <AlertDescription>Classrooms failed</AlertDescription>
      </Alert>,
    );

    expect(container.innerHTML).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("the alert does not use a raw gray utility", () => {
    const { container } = render(
      <Alert>
        <AlertDescription>Classrooms failed</AlertDescription>
      </Alert>,
    );

    expect(container.innerHTML).not.toMatch(
      /\b(?:bg|text|border|from|to|via|ring)-(?:gray|slate|zinc|neutral|stone)-/,
    );
  });
});
