import type { ClassroomFilter } from "@/generated/types.gen";
import { defaultClassroomListFilter } from "./classroom-api";

/** Build list query body — name `like` when the teacher typed a search. */
export function classroomListFilter(search: string): ClassroomFilter {
  const trimmed = search.trim();
  if (trimmed.length === 0) return { ...defaultClassroomListFilter };
  return {
    ...defaultClassroomListFilter,
    filters: [{ field: "name", operator: "like", value: trimmed }],
  };
}
