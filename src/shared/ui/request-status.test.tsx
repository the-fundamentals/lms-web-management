import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestTimeoutError } from "../api/client";
import { RequestStatus } from "./request-status";

describe("RequestStatus", () => {
  afterEach(() => {
    cleanup();
  });

  it("pending shows a skeleton and no retry", () => {
    render(
      <RequestStatus onRetry={vi.fn()} status="pending">
        Ready
      </RequestStatus>,
    );

    expect(screen.getByTestId("loading-screen")).toBeTruthy();
    expect(screen.getByLabelText("Loading")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("pending can render a custom skeleton", () => {
    render(
      <RequestStatus
        onRetry={vi.fn()}
        pending={<div data-testid="custom-pending">Wait</div>}
        status="pending"
      >
        Ready
      </RequestStatus>,
    );

    expect(screen.getByTestId("custom-pending")).toBeTruthy();
    expect(screen.queryByTestId("loading-screen")).toBeNull();
  });

  it("a timeout leaves loading and names the timeout", () => {
    render(
      <RequestStatus
        error={new RequestTimeoutError()}
        onRetry={vi.fn()}
        status="error"
        title="Couldn't load sessions"
      />,
    );

    expect(screen.queryByText("Loading")).toBeNull();
    expect(screen.getByText("Couldn't load sessions")).toBeTruthy();
    expect(screen.getByText("The request timed out")).toBeTruthy();
  });

  it("retry runs the request again", () => {
    const onRetry = vi.fn();
    render(<RequestStatus error={new RequestTimeoutError()} onRetry={onRetry} status="error" />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("the timeout text is present without relying on color", () => {
    render(<RequestStatus error={new RequestTimeoutError()} onRetry={vi.fn()} status="error" />);

    expect(screen.getByText("The request timed out").textContent).toBe("The request timed out");
  });

  it("success shows the result and no error screen", () => {
    const { container } = render(
      <RequestStatus onRetry={vi.fn()} status="success">
        Classroom list
      </RequestStatus>,
    );

    expect(screen.getByText("Classroom list")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
    expect(container.innerHTML).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });
});
