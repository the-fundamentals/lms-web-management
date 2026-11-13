import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { classroomRow } from "../lib/classroom-row-fixture";
import { ClassroomRename } from "./classroom-rename";

const renameClassroom = vi.hoisted(() => vi.fn());

vi.mock("../lib/classroom-api", () => ({
  renameClassroom: (...args: unknown[]) => renameClassroom(...args),
}));

const classroom = classroomRow({ id: "c1", name: "Algebra" });

function typeName(value: string) {
  fireEvent.change(screen.getByTestId("rename-classroom-name"), { target: { value } });
}

describe("classroom rename", () => {
  beforeEach(() => {
    renameClassroom.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("current name is shown for editing", () => {
    render(<ClassroomRename classroom={classroom} onRenamed={vi.fn()} />);
    expect((screen.getByTestId("rename-classroom-name") as HTMLInputElement).value).toBe(
      "Algebra",
    );
  });

  it("empty submit names the name field and keeps typed values", async () => {
    render(<ClassroomRename classroom={classroom} onRenamed={vi.fn()} />);
    typeName("  ");
    fireEvent.click(screen.getByTestId("rename-classroom-submit"));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent?.toLowerCase()).toContain("name"),
    );
    expect((screen.getByTestId("rename-classroom-name") as HTMLInputElement).value).toBe("  ");
    expect(renameClassroom).not.toHaveBeenCalled();
  });

  it("successful save shows the new name", async () => {
    const onRenamed = vi.fn();
    renameClassroom.mockResolvedValue(classroomRow({ id: "c1", name: "Geometry" }));
    render(<ClassroomRename classroom={classroom} onRenamed={onRenamed} />);
    typeName("Geometry");
    fireEvent.click(screen.getByTestId("rename-classroom-submit"));
    await waitFor(() => expect(renameClassroom).toHaveBeenCalledWith("c1", "Geometry"));
    expect(onRenamed).toHaveBeenCalledWith(classroomRow({ id: "c1", name: "Geometry" }));
  });

  it("dirty form asks before leaving", () => {
    render(<ClassroomRename classroom={classroom} onRenamed={vi.fn()} />);
    typeName("Geometry");
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("save control has data-testid rename-classroom-submit", () => {
    render(<ClassroomRename classroom={classroom} onRenamed={vi.fn()} />);
    expect(screen.getByTestId("rename-classroom-submit")).toBeTruthy();
  });

  it("a second click while save is in flight does not call rename again", async () => {
    let finish: (value: { id: string; name: string }) => void = () => undefined;
    renameClassroom.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<ClassroomRename classroom={classroom} onRenamed={vi.fn()} />);
    typeName("Geometry");
    fireEvent.click(screen.getByTestId("rename-classroom-submit"));
    await waitFor(() => expect(screen.getByTestId("loading-screen")).toBeTruthy());
    expect(renameClassroom).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("rename-classroom-submit")).toBeNull();
    finish(classroomRow({ id: "c1", name: "Geometry" }));
    await waitFor(() => expect(screen.queryByTestId("loading-screen")).toBeNull());
  });
});
