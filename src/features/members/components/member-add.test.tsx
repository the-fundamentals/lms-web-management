import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accountRow, memberRow } from "../lib/member-row-fixture";
import { MemberAdd } from "./member-add";

const searchAccounts = vi.hoisted(() => vi.fn());
const addMembers = vi.hoisted(() => vi.fn());

vi.mock("../lib/member-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/member-api")>("../lib/member-api");
  return {
    ...actual,
    searchAccounts: (...args: unknown[]) => searchAccounts(...args),
    addMembers: (...args: unknown[]) => addMembers(...args),
  };
});

function renderAdd(active = [memberRow({ id: "m1", accountId: "acc-m1", name: "Existing" })]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onAdded = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <MemberAdd
        activeMembers={active}
        classroomId="c1"
        onAdded={onAdded}
        onOpenChange={onOpenChange}
        open
      />
    </QueryClientProvider>,
  );
  return { onAdded, onOpenChange };
}

describe("member add", () => {
  beforeEach(() => {
    searchAccounts.mockReset();
    addMembers.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("search results come from accounts query and skip already-active", async () => {
    searchAccounts.mockResolvedValue([
      accountRow({ id: "acc-m1", email: "existing@example.com", firstName: "Ex" }),
      accountRow({ id: "a2", email: "new@example.com", firstName: "New", lastName: "Kid" }),
    ]);
    renderAdd();
    fireEvent.change(screen.getByTestId("member-search"), { target: { value: "new@" } });
    await vi.advanceTimersByTimeAsync(350);
    await waitFor(() => expect(screen.getByTestId("member-search-row-a2")).toBeTruthy());
    expect(screen.queryByTestId("member-search-row-acc-m1")).toBeNull();
  });

  it("save posts createClassroomMembers once", async () => {
    searchAccounts.mockResolvedValue([accountRow({ id: "a2", email: "new@example.com" })]);
    addMembers.mockResolvedValue([memberRow({ id: "m2", accountId: "a2" })]);
    const { onAdded } = renderAdd([]);
    fireEvent.change(screen.getByTestId("member-search"), { target: { value: "new@" } });
    await vi.advanceTimersByTimeAsync(350);
    await waitFor(() => expect(screen.getByTestId("member-search-row-a2")).toBeTruthy());
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByTestId("member-add-save"));
    await waitFor(() => expect(addMembers).toHaveBeenCalledTimes(1));
    expect(addMembers).toHaveBeenCalledWith("c1", ["a2"]);
    expect(onAdded).toHaveBeenCalled();
  });

  it("double-submit guard only calls add once while saving", async () => {
    let resolveAdd: (value: unknown) => void = () => undefined;
    searchAccounts.mockResolvedValue([accountRow({ id: "a2" })]);
    addMembers.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAdd = resolve;
        }),
    );
    renderAdd([]);
    fireEvent.change(screen.getByTestId("member-search"), { target: { value: "a" } });
    await vi.advanceTimersByTimeAsync(350);
    await waitFor(() => expect(screen.getByTestId("member-search-row-a2")).toBeTruthy());
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByTestId("member-add-save"));
    fireEvent.click(screen.getByTestId("member-add-save"));
    expect(addMembers).toHaveBeenCalledTimes(1);
    resolveAdd([]);
    await waitFor(() => expect(addMembers).toHaveBeenCalledTimes(1));
  });

  it("server error shows alert and leaves sheet open", async () => {
    searchAccounts.mockResolvedValue([accountRow({ id: "a2" })]);
    addMembers.mockRejectedValue(new Error("server down"));
    const { onOpenChange } = renderAdd([]);
    fireEvent.change(screen.getByTestId("member-search"), { target: { value: "a" } });
    await vi.advanceTimersByTimeAsync(350);
    await waitFor(() => expect(screen.getByTestId("member-search-row-a2")).toBeTruthy());
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByTestId("member-add-save"));
    await waitFor(() => expect(screen.getByTestId("member-add-error")).toBeTruthy());
    expect(screen.getByText(/server down/i)).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
