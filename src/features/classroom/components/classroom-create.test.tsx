import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClassroomCreate } from "./classroom-create";

const navigate = vi.hoisted(() => vi.fn(async () => undefined));
const createClassroomNamed = vi.hoisted(() => vi.fn());
const uploadPublicBanner = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("../lib/classroom-api", () => ({
  createClassroomNamed: (...args: unknown[]) => createClassroomNamed(...args),
}));

vi.mock("../lib/upload-public-banner", () => ({
  uploadPublicBanner: (...args: unknown[]) => uploadPublicBanner(...args),
}));

function typeName(value: string) {
  fireEvent.change(screen.getByTestId("classroom-name"), { target: { value } });
}

describe("classroom create", () => {
  beforeEach(() => {
    navigate.mockReset();
    createClassroomNamed.mockReset();
    uploadPublicBanner.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows name and banner; payment plan stays collapsed as none", () => {
    render(<ClassroomCreate />);
    expect(screen.getByLabelText("Name")).toBeTruthy();
    expect(screen.getByTestId("classroom-banner-picker")).toBeTruthy();
    expect(screen.getByTestId("classroom-plan-panel").textContent).toMatch(/none/i);
    expect(screen.queryByTestId("classroom-plan-amount")).toBeNull();
    expect(screen.getByTestId("create-classroom-submit")).toBeTruthy();
  });

  it("opens the optional plan panel to edit amount; type is fixed per session", () => {
    render(<ClassroomCreate />);
    fireEvent.click(screen.getByTestId("classroom-plan-toggle"));
    expect(screen.getByTestId("classroom-plan-amount")).toBeTruthy();
    expect((screen.getByTestId("classroom-plan-type") as HTMLInputElement).value).toBe(
      "Per session",
    );
    expect((screen.getByTestId("classroom-plan-type") as HTMLInputElement).disabled).toBe(true);
  });

  it("collapsing the plan panel keeps the typed amount", () => {
    render(<ClassroomCreate />);
    fireEvent.click(screen.getByTestId("classroom-plan-toggle"));
    fireEvent.change(screen.getByTestId("classroom-plan-amount"), {
      target: { value: "150000" },
    });
    fireEvent.click(screen.getByTestId("classroom-plan-toggle"));
    expect(screen.queryByTestId("classroom-plan-amount")).toBeNull();
    expect(screen.getByTestId("classroom-plan-panel").textContent).toContain("150,000");
    fireEvent.click(screen.getByTestId("classroom-plan-toggle"));
    expect((screen.getByTestId("classroom-plan-amount") as HTMLInputElement).value).toBe(
      "150,000",
    );
  });

  it("empty submit names the name field and keeps typed values", async () => {
    render(<ClassroomCreate />);
    typeName("   ");
    fireEvent.click(screen.getByTestId("create-classroom-submit"));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent?.toLowerCase()).toContain("name"),
    );
    expect((screen.getByTestId("classroom-name") as HTMLInputElement).value).toBe("   ");
    expect(createClassroomNamed).not.toHaveBeenCalled();
  });

  it("successful save without opening plan omits basePaymentPlan and goes to classrooms", async () => {
    createClassroomNamed.mockResolvedValue({ id: "c1", name: "Algebra" });
    render(<ClassroomCreate />);
    typeName("Algebra");
    fireEvent.click(screen.getByTestId("create-classroom-submit"));
    await waitFor(() =>
      expect(createClassroomNamed).toHaveBeenCalledWith({
        name: "Algebra",
      }),
    );
    expect(navigate).toHaveBeenCalledWith({ to: "/classrooms" });
  });

  it("includes bannerKey and plan amount after upload and opening the plan panel", async () => {
    const key = "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    uploadPublicBanner.mockResolvedValue({ objectKey: key, downloadUrl: "http://cdn/preview" });
    createClassroomNamed.mockResolvedValue({ id: "c1", name: "Algebra", bannerKey: key });
    render(<ClassroomCreate />);
    typeName("Algebra");
    const file = new File(["banner"], "banner.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("classroom-banner-file"), { target: { files: [file] } });
    await waitFor(() => expect(uploadPublicBanner).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId("classroom-plan-toggle"));
    fireEvent.change(screen.getByTestId("classroom-plan-amount"), {
      target: { value: "150,000" },
    });
    fireEvent.click(screen.getByTestId("create-classroom-submit"));
    await waitFor(() =>
      expect(createClassroomNamed).toHaveBeenCalledWith({
        name: "Algebra",
        bannerKey: key,
        basePaymentPlan: { amount: 150000, type: "PER_SESSION" },
      }),
    );
  });

  it("a second click while save is in flight does not call create again", async () => {
    let finish: (value: { id: string; name: string }) => void = () => undefined;
    createClassroomNamed.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<ClassroomCreate />);
    typeName("Algebra");
    fireEvent.click(screen.getByTestId("create-classroom-submit"));
    await waitFor(() => expect(screen.getByTestId("loading-screen")).toBeTruthy());
    expect(createClassroomNamed).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("create-classroom-submit")).toBeNull();
    finish({ id: "c1", name: "Algebra" });
    await waitFor(() => expect(navigate).toHaveBeenCalled());
  });

  it("dirty form asks before leaving", () => {
    render(<ClassroomCreate />);
    typeName("Algebra");
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
