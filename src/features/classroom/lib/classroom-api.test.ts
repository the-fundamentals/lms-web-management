import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClassroomResponse } from "@/generated/types.gen";
import {
  createClassroomBody,
  defaultClassroomListFilter,
  mapClassroomRows,
  updateClassroomBody,
} from "./classroom-api";

vi.mock("@/generated/sdk.gen", () => ({
  createClassroom: vi.fn(),
  getAllClassrooms: vi.fn(),
  getClassroomById: vi.fn(),
  updateClassroom: vi.fn(),
}));

vi.mock("@/shared/api/query-client", () => ({
  queryClient: { invalidateQueries: vi.fn(async () => undefined) },
}));

function classroom(partial: Partial<ClassroomResponse> & Pick<ClassroomResponse, "id" | "name">): ClassroomResponse {
  return {
    basePaymentPlanAmount: 0,
    basePaymentPlanType: "PER_SESSION",
    createdDate: "2026-11-11T00:00:00.000Z",
    lastModifiedDate: "2026-11-11T00:00:00.000Z",
    numberOfMembers: 0,
    status: "ACTIVE",
    ...partial,
  };
}

describe("classroom api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create payload includes name, optional bannerKey, and basePaymentPlan", () => {
    expect(createClassroomBody({ name: "Chemistry" })).toEqual({ name: "Chemistry" });
    expect(
      createClassroomBody({
        name: "Chemistry",
        bannerKey: "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        basePaymentPlan: { type: "PER_SESSION", amount: 0 },
      }),
    ).toEqual({
      name: "Chemistry",
      bannerKey: "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      basePaymentPlan: { type: "PER_SESSION", amount: 0 },
    });
  });

  it("update payload sends the new name and does not invent a banner key", () => {
    expect(updateClassroomBody("Physics")).toEqual({ name: "Physics" });
    expect(updateClassroomBody("Physics")).not.toHaveProperty("bannerKey");
  });

  it("list filter defaults to page 0 and size 50", () => {
    expect(defaultClassroomListFilter).toEqual({ page: 0, size: 50 });
  });

  it("list mapping keeps two rows that share a name as two rows", () => {
    const rows = mapClassroomRows([
      classroom({ id: "c1", name: "Same" }),
      classroom({ id: "c2", name: "Same" }),
    ]);
    expect(rows).toEqual([
      {
        id: "c1",
        name: "Same",
        numberOfMembers: 0,
        status: "ACTIVE",
        createdDate: "2026-11-11T00:00:00.000Z",
        basePaymentPlanType: "PER_SESSION",
        basePaymentPlanAmount: 0,
      },
      {
        id: "c2",
        name: "Same",
        numberOfMembers: 0,
        status: "ACTIVE",
        createdDate: "2026-11-11T00:00:00.000Z",
        basePaymentPlanType: "PER_SESSION",
        basePaymentPlanAmount: 0,
      },
    ]);
  });
});

