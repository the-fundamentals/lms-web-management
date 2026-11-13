import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { classroomRow } from "../lib/classroom-row-fixture";
import { ClassroomSettings } from "./classroom-settings";

describe("classroom settings general pane", () => {
  afterEach(() => cleanup());

  it("rename entry is present", () => {
    render(
      <ClassroomSettings
        classroom={classroomRow({ id: "c1", name: "Algebra", basePaymentPlanAmount: 300000 })}
        onRenamed={vi.fn()}
      />,
    );
    expect(screen.getByTestId("settings-general")).toBeTruthy();
    fireEvent.click(screen.getByTestId("classroom-rename-entry"));
    expect(screen.getByTestId("classroom-rename")).toBeTruthy();
  });
});
