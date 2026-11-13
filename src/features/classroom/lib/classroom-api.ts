import {
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
} from "@/generated/sdk.gen";
import type {
  ClassroomFilter,
  ClassroomResponse,
  CreateClassroomCommand,
  PaymentPlanType,
} from "@/generated/types.gen";
import { queryClient } from "@/shared/api/query-client";
import { DEFAULT_PAYMENT_PLAN_TYPE } from "./classroom-payment";

export const classroomsQueryKey = ["classrooms"] as const;

export type ClassroomRow = {
  id: string;
  name: string;
  bannerKey?: string;
  numberOfMembers: number;
  status: ClassroomResponse["status"];
  createdDate: string;
  basePaymentPlanType: ClassroomResponse["basePaymentPlanType"];
  basePaymentPlanAmount: number;
};

export type CreateClassroomInput = {
  name: string;
  bannerKey?: string;
  basePaymentPlan?: {
    amount?: number;
    type?: PaymentPlanType;
  };
};

export const defaultClassroomListFilter: ClassroomFilter = {
  page: 0,
  size: 50,
};

export function mapClassroomRow(classroom: ClassroomResponse): ClassroomRow {
  return {
    id: classroom.id,
    name: classroom.name,
    numberOfMembers: classroom.numberOfMembers,
    status: classroom.status,
    createdDate: classroom.createdDate,
    basePaymentPlanType: classroom.basePaymentPlanType,
    basePaymentPlanAmount: classroom.basePaymentPlanAmount,
    ...(classroom.bannerKey ? { bannerKey: classroom.bannerKey } : {}),
  };
}

export function mapClassroomRows(classrooms: ClassroomResponse[]): ClassroomRow[] {
  return classrooms.map(mapClassroomRow);
}

export function createClassroomBody(input: CreateClassroomInput): CreateClassroomCommand {
  const body: CreateClassroomCommand = { name: input.name };
  if (input.bannerKey) body.bannerKey = input.bannerKey;
  const plan = input.basePaymentPlan;
  if (plan) {
    body.basePaymentPlan = {
      type: plan.type ?? DEFAULT_PAYMENT_PLAN_TYPE,
      amount: plan.amount ?? 0,
    };
  }
  return body;
}

export function updateClassroomBody(name: string): { name: string } {
  return { name };
}

export async function listClassrooms(
  filter: ClassroomFilter = defaultClassroomListFilter,
): Promise<ClassroomRow[]> {
  const result = await getAllClassrooms({ body: filter, throwOnError: true });
  return mapClassroomRows(result.data ?? []);
}

export async function fetchClassroom(id: string): Promise<ClassroomRow> {
  const result = await getClassroomById({ path: { id }, throwOnError: true });
  return mapClassroomRow(result.data);
}

export async function createClassroomNamed(input: CreateClassroomInput): Promise<ClassroomRow> {
  const result = await createClassroom({
    body: createClassroomBody(input),
    throwOnError: true,
  });
  await queryClient.invalidateQueries({ queryKey: classroomsQueryKey });
  return mapClassroomRow(result.data);
}

export async function renameClassroom(id: string, name: string): Promise<ClassroomRow> {
  const result = await updateClassroom({
    body: updateClassroomBody(name),
    path: { id },
    throwOnError: true,
  });
  await queryClient.invalidateQueries({ queryKey: classroomsQueryKey });
  return mapClassroomRow(result.data);
}

export function classroomsQueryOptions(filter: ClassroomFilter = defaultClassroomListFilter) {
  return {
    queryKey: [...classroomsQueryKey, filter] as const,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      getAllClassrooms({ body: filter, signal, throwOnError: true }).then((result) =>
        mapClassroomRows(result.data ?? []),
      ),
  };
}
