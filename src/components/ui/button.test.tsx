import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  afterEach(() => {
    cleanup();
  });

  it("the control renders as a button", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" }).tagName).toBe("BUTTON");
  });

  it("the button is reachable by keyboard", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });

    button.focus();

    expect(document.activeElement).toBe(button);
  });

  it("the markup uses a semantic color class", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" }).className).toContain("bg-primary");
  });

  it("the markup contains no hex color", () => {
    const { container } = render(<Button>Save</Button>);

    expect(container.innerHTML).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("the button height is 36px", () => {
    render(<Button>Save</Button>);

    // Tailwind's default h-9 is 2.25rem, which is 36px.
    expect(screen.getByRole("button", { name: "Save" }).className.split(/\s+/)).toContain("h-9");
  });
});
