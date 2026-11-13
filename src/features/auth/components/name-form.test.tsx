import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NameForm } from "./name-form";

vi.mock("../lib/upload-public-avatar", () => ({
  uploadPublicAvatar: vi.fn(async () => ({
    downloadUrl: "http://api.test/preview",
    objectKey: "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  })),
}));

import { uploadPublicAvatar } from "../lib/upload-public-avatar";

function typeName(testId: "first-name" | "last-name", value: string) {
  fireEvent.change(screen.getByTestId(testId), { target: { value } });
}

function fieldValue(testId: "first-name" | "last-name"): string {
  return (screen.getByTestId(testId) as HTMLInputElement).value;
}

describe("name form", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(uploadPublicAvatar).mockClear();
  });

  it("first name and last name are shown", () => {
    render(<NameForm onSave={vi.fn()} />);

    expect(screen.getByLabelText("First name")).toBeTruthy();
    expect(screen.getByLabelText("Last name")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Your name" }).className.includes("type-page")).toBe(true);
  });

  it("there is no email field", () => {
    render(<NameForm onSave={vi.fn()} />);

    expect(screen.queryByLabelText(/email/i)).toBeNull();
    expect(document.body.innerHTML.toLowerCase().includes("email")).toBe(false);
  });

  it("an empty first name names that field and keeps the last name", async () => {
    render(<NameForm onSave={vi.fn()} />);
    typeName("last-name", "Nguyễn");

    fireEvent.click(screen.getByTestId("save-name"));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent?.toLowerCase().includes("first name")).toBe(
        true,
      ),
    );
    expect(fieldValue("last-name")).toBe("Nguyễn");
    expect(fieldValue("first-name")).toBe("");
  });

  it("an empty last name names that field and keeps the first name", async () => {
    render(<NameForm onSave={vi.fn()} />);
    typeName("first-name", "An");

    fireEvent.click(screen.getByTestId("save-name"));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent?.toLowerCase().includes("last name")).toBe(
        true,
      ),
    );
    expect(fieldValue("first-name")).toBe("An");
    expect(fieldValue("last-name")).toBe("");
  });

  it("Vietnamese characters stay as typed", () => {
    render(<NameForm onSave={vi.fn()} />);
    typeName("first-name", "Nguyễn");
    typeName("last-name", "Văn");

    expect(fieldValue("first-name")).toBe("Nguyễn");
    expect(fieldValue("last-name")).toBe("Văn");
  });

  it("a dirty form asks before leaving", () => {
    render(<NameForm onSave={vi.fn()} />);
    typeName("first-name", "An");
    const event = new Event("beforeunload", { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("save does not invent a second avatar key", async () => {
    const saved: string[] = [];
    const existing = "public/11111111-1111-4111-8111-111111111111";
    render(
      <NameForm
        avatarKey={existing}
        onSave={(body) => {
          saved.push(body.avatarKey);
        }}
      />,
    );
    typeName("first-name", "An");
    typeName("last-name", "B");

    fireEvent.click(screen.getByTestId("save-name"));
    fireEvent.click(screen.getByTestId("save-name"));

    await waitFor(() => expect(saved).toEqual([existing, existing]));
  });

  it("save without a photo requires a profile picture", async () => {
    const onSave = vi.fn();
    render(<NameForm onSave={onSave} />);
    typeName("first-name", "An");
    typeName("last-name", "B");

    fireEvent.click(screen.getByTestId("save-name"));

    await waitFor(() =>
      expect(
        screen.getByRole("alert").textContent?.toLowerCase().includes("profile picture"),
      ).toBe(true),
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("an uploaded photo replaces the avatar key on save", async () => {
    const saved: string[] = [];
    const uploaded = "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    render(
      <NameForm
        avatarKey="public/11111111-1111-4111-8111-111111111111"
        onSave={(body) => {
          saved.push(body.avatarKey);
        }}
      />,
    );
    const file = new File(["bytes"], "me.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-file"), { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadPublicAvatar).toHaveBeenCalledWith(file);
    });
    typeName("first-name", "An");
    typeName("last-name", "B");
    fireEvent.click(screen.getByTestId("save-name"));

    await waitFor(() => expect(saved).toEqual([uploaded]));
  });

  it("the screen has no sidebar", () => {
    render(<NameForm onSave={vi.fn()} />);

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(document.querySelector("aside")).toBeNull();
    expect((document.body.textContent ?? "").toLowerCase().includes("sidebar")).toBe(false);
  });
});
