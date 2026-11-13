import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { memberRow } from "../lib/member-row-fixture";
import { MemberRemoveDialog } from "./member-remove-dialog";

afterEach(() => {
  cleanup();
});

describe("member remove dialog", () => {
  it("confirmation names the person", () => {
    render(
      <MemberRemoveDialog
        member={memberRow({ id: "m1", name: "Ann Active" })}
        onConfirm={() => undefined}
        onOpenChange={() => undefined}
        open
      />,
    );
    expect(screen.getByTestId("member-remove-dialog")).toBeTruthy();
    expect(screen.getByText(/remove ann active/i)).toBeTruthy();
  });

  it("confirm calls onConfirm", () => {
    const onConfirm = vi.fn();
    render(
      <MemberRemoveDialog
        member={memberRow({ id: "m1", name: "Ann" })}
        onConfirm={onConfirm}
        onOpenChange={() => undefined}
        open
      />,
    );
    fireEvent.click(screen.getByTestId("member-remove-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancel does not call onConfirm", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <MemberRemoveDialog
        member={memberRow({ id: "m1", name: "Ann" })}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
        open
      />,
    );
    fireEvent.click(screen.getByTestId("member-remove-cancel"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("falls back to email when name is blank", () => {
    render(
      <MemberRemoveDialog
        member={memberRow({ id: "m1", name: "   ", email: "ann@example.com" })}
        onConfirm={() => undefined}
        onOpenChange={() => undefined}
        open
      />,
    );
    expect(screen.getByText(/remove ann@example.com/i)).toBeTruthy();
  });
});
