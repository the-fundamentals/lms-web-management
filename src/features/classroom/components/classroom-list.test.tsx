import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { classroomRow } from "../lib/classroom-row-fixture";
import { ClassroomList } from "./classroom-list";

const listClassrooms = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    params,
    to,
    ...rest
  }: {
    children?: ReactNode;
    params?: { classroomId?: string };
    to: string;
  }) => {
    const href =
      to === "/classrooms/$classroomId"
        ? `/classrooms/${params?.classroomId ?? ""}`
        : to;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("../lib/classroom-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/classroom-api")>("../lib/classroom-api");
  return {
    ...actual,
    classroomsQueryOptions: (filter: unknown) => ({
      queryKey: ["classrooms", "test", filter],
      queryFn: () => listClassrooms(filter),
    }),
  };
});

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ClassroomList />
    </QueryClientProvider>,
  );
}

describe("classroom list", () => {
  beforeEach(() => {
    listClassrooms.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("loading state uses the shared loading screen", () => {
    listClassrooms.mockReturnValue(new Promise(() => undefined));
    renderList();
    expect(screen.getByTestId("loading-screen")).toBeTruthy();
  });

  it("empty successful load says there are none and offers New classroom", async () => {
    listClassrooms.mockResolvedValue([]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("classroom-empty")).toBeTruthy());
    expect(screen.getByText(/no classrooms yet/i)).toBeTruthy();
    expect(screen.getByTestId("new-classroom")).toBeTruthy();
  });

  it("failed load uses the shared error screen and is not the empty copy", async () => {
    listClassrooms.mockRejectedValue(new Error("boom"));
    renderList();
    await waitFor(() => expect(screen.getByTestId("error-screen")).toBeTruthy());
    expect(screen.queryByText(/no classrooms yet/i)).toBeNull();
  });

  it("rows render name and are distinct by id when names match", async () => {
    listClassrooms.mockResolvedValue([
      classroomRow({ id: "a", name: "Same" }),
      classroomRow({ id: "b", name: "Same" }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("classroom-row-a")).toBeTruthy());
    expect(screen.getByTestId("classroom-row-b")).toBeTruthy();
    expect(screen.getAllByText("Same")).toHaveLength(2);
  });

  it("New classroom control has data-testid new-classroom", async () => {
    listClassrooms.mockResolvedValue([classroomRow({ id: "a", name: "Algebra" })]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("new-classroom")).toBeTruthy());
    expect(screen.getByTestId("new-classroom").getAttribute("href")).toBe("/classrooms/new");
  });

  it("choosing a row navigates toward /classrooms/$classroomId", async () => {
    listClassrooms.mockResolvedValue([classroomRow({ id: "room-1", name: "Algebra" })]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("classroom-row-room-1")).toBeTruthy());
    expect(screen.getByTestId("classroom-row-room-1").getAttribute("href")).toBe(
      "/classrooms/room-1",
    );
  });

  it("search sends a name like filter after debounce", async () => {
    listClassrooms.mockResolvedValue([]);
    renderList();
    fireEvent.change(screen.getByTestId("classroom-search"), { target: { value: "Alg" } });
    await waitFor(() =>
      expect(listClassrooms).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: [{ field: "name", operator: "like", value: "Alg" }],
        }),
      ),
    );
  });

  it("card view switches the list layout; table stays disabled", async () => {
    listClassrooms.mockResolvedValue([classroomRow({ id: "a", name: "Algebra" })]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("classroom-list")).toBeTruthy());
    expect(screen.getByTestId("classroom-list").getAttribute("data-view")).toBe("list");
    fireEvent.click(screen.getByTestId("classroom-view-card"));
    expect(screen.getByTestId("classroom-list").getAttribute("data-view")).toBe("card");
    expect(screen.getByTestId("classroom-view-table").hasAttribute("disabled")).toBe(true);
  });

  it("list rows show members and plan summary", async () => {
    listClassrooms.mockResolvedValue([
      classroomRow({
        id: "a",
        name: "Algebra",
        numberOfMembers: 3,
        basePaymentPlanAmount: 150000,
      }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByTestId("classroom-row-a")).toBeTruthy());
    expect(screen.getByTestId("classroom-row-a").textContent).toContain("3 members");
    expect(screen.getByTestId("classroom-row-a").textContent).toContain("150,000 VND");
  });
});
