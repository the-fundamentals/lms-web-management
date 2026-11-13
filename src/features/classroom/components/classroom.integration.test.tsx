import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken, setAccessToken } from "@/shared/api/token";
import { ClassroomCreate } from "./classroom-create";
import { ClassroomLayout } from "./classroom-layout";
import { ClassroomList } from "./classroom-list";
import { ClassroomSettings } from "./classroom-settings";

const navigate = vi.hoisted(() => vi.fn(async () => undefined));

const sdk = vi.hoisted(() => {
  type Classroom = {
    id: string;
    name: string;
    numberOfMembers: number;
    status: "ACTIVE";
    createdDate: string;
    lastModifiedDate: string;
    basePaymentPlanType: "PER_SESSION";
    basePaymentPlanAmount: number;
  };
  const classrooms: Classroom[] = [];
  const row = (id: string, name: string): Classroom => ({
    id,
    name,
    numberOfMembers: 0,
    status: "ACTIVE",
    createdDate: "2026-11-11T00:00:00.000Z",
    lastModifiedDate: "2026-11-11T00:00:00.000Z",
    basePaymentPlanType: "PER_SESSION",
    basePaymentPlanAmount: 0,
  });
  return {
    classrooms,
    row,
    reset() {
      classrooms.length = 0;
    },
    createClassroom: vi.fn(async (options: { body: { name: string; bannerKey?: string; basePaymentPlan?: { type?: string; amount?: number } } }) => {
      expect(options.body.name).toBeTruthy();
      const created = row(`id-${classrooms.length + 1}`, options.body.name);
      classrooms.push(created);
      return { data: created };
    }),
    getAllClassrooms: vi.fn(async (options?: { body?: { filters?: Array<{ field: string; operator: string; value: string }> } }) => {
      const like = options?.body?.filters?.find(
        (item) => item.field === "name" && item.operator === "like",
      )?.value;
      const data = like
        ? classrooms.filter((item) => item.name.toLowerCase().includes(like.toLowerCase()))
        : [...classrooms];
      return { data };
    }),

    getClassroomById: vi.fn(async (options: { path: { id: string } }) => {
      const found = classrooms.find((item) => item.id === options.path.id);
      if (!found) throw new Error("not found");
      return { data: found };
    }),
    updateClassroom: vi.fn(async (options: { body: { name: string }; path: { id: string } }) => {
      expect(Object.keys(options.body)).toEqual(["name"]);
      const index = classrooms.findIndex((item) => item.id === options.path.id);
      if (index < 0) throw new Error("not found");
      classrooms[index] = { ...classrooms[index], name: options.body.name };
      return { data: classrooms[index] };
    }),
  };
});

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
  Outlet: () => <div data-testid="router-outlet-child">outlet</div>,
  useNavigate: () => navigate,
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: "/classrooms/c1" } }),
}));

vi.mock("@/generated/sdk.gen", () => ({
  createClassroom: (...args: unknown[]) => sdk.createClassroom(...(args as [never])),
  getAllClassrooms: (...args: unknown[]) => sdk.getAllClassrooms(...(args as [])),
  getClassroomById: (...args: unknown[]) => sdk.getClassroomById(...(args as [never])),
  updateClassroom: (...args: unknown[]) => sdk.updateClassroom(...(args as [never])),
}));

vi.mock("@/shared/api/query-client", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api/query-client")>(
    "@/shared/api/query-client",
  );
  return {
    ...actual,
    queryClient: {
      invalidateQueries: vi.fn(async () => undefined),
    },
  };
});

beforeEach(() => {
  sdk.reset();
  navigate.mockReset();
  setAccessToken("access-marker");
  sdk.createClassroom.mockClear();
  sdk.getAllClassrooms.mockClear();
  sdk.getClassroomById.mockClear();
  sdk.updateClassroom.mockClear();
});

afterEach(() => {
  cleanup();
  setAccessToken("");
});

function wrap(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

describe("classroom integration", () => {
  it("empty list response renders the empty state and New classroom", async () => {
    wrap(<ClassroomList />);
    await waitFor(() => expect(screen.getByTestId("classroom-empty")).toBeTruthy());
    expect(screen.getAllByTestId("new-classroom").length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain("access-marker");
    expect(getAccessToken()).toBe("access-marker");
  });

  it("create posts name only (plan collapsed = none), then the list includes the new classroom", async () => {
    wrap(<ClassroomCreate />);
    fireEvent.change(screen.getByTestId("classroom-name"), { target: { value: "Biology" } });
    fireEvent.click(screen.getByTestId("create-classroom-submit"));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/classrooms" }));
    expect(sdk.createClassroom).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          name: "Biology",
        },
      }),
    );
    expect(sdk.classrooms.map((row) => row.name)).toEqual(["Biology"]);

    wrap(<ClassroomList />);
    await waitFor(() => expect(screen.getByText("Biology")).toBeTruthy());
    expect(document.body.textContent).not.toContain("access-marker");
  });

  it("rename from Settings updates the classroom; no token appears in the document", async () => {
    sdk.classrooms.push(sdk.row("c1", "Algebra"));
    const onRenamed = vi.fn();
    wrap(
      <ClassroomSettings
        classroom={{
          id: "c1",
          name: "Algebra",
          numberOfMembers: 0,
          status: "ACTIVE",
          createdDate: "2026-11-11T00:00:00.000Z",
          basePaymentPlanType: "PER_SESSION",
          basePaymentPlanAmount: 0,
        }}
        onRenamed={onRenamed}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("classroom-rename-entry")).toBeTruthy());
    fireEvent.click(screen.getByTestId("classroom-rename-entry"));
    fireEvent.change(screen.getByTestId("rename-classroom-name"), {
      target: { value: "Geometry" },
    });
    fireEvent.click(screen.getByTestId("rename-classroom-submit"));
    await waitFor(() => expect(onRenamed).toHaveBeenCalled());
    expect(sdk.classrooms[0]?.name).toBe("Geometry");
    expect(sdk.updateClassroom).toHaveBeenCalledWith(
      expect.objectContaining({ body: { name: "Geometry" }, path: { id: "c1" } }),
    );
    expect(document.body.textContent).not.toContain("access-marker");
  });
});
