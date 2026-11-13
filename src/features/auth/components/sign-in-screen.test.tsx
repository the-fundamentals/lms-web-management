import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignInScreen } from "./sign-in-screen";

describe("sign-in screen", () => {
  afterEach(() => {
    cleanup();
  });

  it("Sign in is shown", () => {
    render(<SignInScreen onSignIn={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sign in" }).className.includes("type-page")).toBe(true);
  });

  it("the screen has no sidebar", () => {
    render(<SignInScreen onSignIn={vi.fn()} />);

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(document.querySelector("aside")).toBeNull();
    expect((document.body.textContent ?? "").toLowerCase().includes("sidebar")).toBe(false);
  });

  it("the unsaved notice is shown when the notice is set", () => {
    render(<SignInScreen notice="unsaved" onSignIn={vi.fn()} />);

    expect(screen.getByRole("alert").textContent).toContain(
      "The entries on the previous form were not saved.",
    );
  });

  it("the notice is absent when it is unset", () => {
    render(<SignInScreen onSignIn={vi.fn()} />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText(/not saved/i)).toBeNull();
  });

  it("a token passed in is not rendered", () => {
    const supplied = "supplied-marker";
    render(<SignInScreen onSignIn={vi.fn()} token={supplied} />);

    expect((document.body.textContent ?? "").includes(supplied)).toBe(false);
    expect(document.body.innerHTML.includes(supplied)).toBe(false);
  });

  it("the Sign in button has data-testid sign-in", () => {
    render(<SignInScreen onSignIn={vi.fn()} />);

    expect(screen.getByTestId("sign-in").tagName).toBe("BUTTON");
  });
});
