import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoneyInput } from "./money-input";

describe("MoneyInput", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows commas and a VND suffix while emitting raw digits", () => {
    const onValueChange = vi.fn();
    render(
      <MoneyInput
        data-testid="money"
        onValueChange={onValueChange}
        value="1500000"
      />,
    );
    const input = screen.getByTestId("money") as HTMLInputElement;
    expect(input.value).toBe("1,500,000");
    expect(screen.getByText("VND")).toBeTruthy();

    fireEvent.change(input, { target: { value: "2,000" } });
    expect(onValueChange).toHaveBeenCalledWith("2000");
  });
});
