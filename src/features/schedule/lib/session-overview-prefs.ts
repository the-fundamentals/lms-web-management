import {
  DEFAULT_SESSION_STATUS_FILTER,
  type SessionBucket,
  type SessionStatusFilter,
} from "./session-buckets";
import type { SessionDateRange } from "./session-api";
import { rangeForPreset, type ListRangePreset } from "./session-list-range";

export type { ListRangePreset } from "./session-list-range";

export type SessionOverviewView = "calendar" | "list";

/** Which Active/Upcoming/Past sections are expanded in list view. */
export type ListGroupsOpen = Record<SessionBucket, boolean>;

export type SessionOverviewPrefs = {
  view: SessionOverviewView;
  statusFilter: SessionStatusFilter;
  listPreset: ListRangePreset;
  /** Kept for `custom`; named presets recompute from “today” on read. */
  listRange: SessionDateRange;
  listGroupsOpen: ListGroupsOpen;
};

const STORAGE_PREFIX = "lms.sessions.overview:";

const PRESETS: ListRangePreset[] = ["this_week", "this_month", "next_month", "custom"];

function storageKey(classroomId: string): string {
  return `${STORAGE_PREFIX}${classroomId}`;
}

function isView(value: unknown): value is SessionOverviewView {
  return value === "calendar" || value === "list";
}

function isStatusFilter(value: unknown): value is SessionStatusFilter {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.OPEN === "boolean" &&
    typeof record.COMPLETED === "boolean" &&
    typeof record.CANCELLED === "boolean"
  );
}

function isPreset(value: unknown): value is ListRangePreset {
  return typeof value === "string" && PRESETS.includes(value as ListRangePreset);
}

function isDateRange(value: unknown): value is SessionDateRange {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.from === "string" && typeof record.to === "string";
}

function isListGroupsOpen(value: unknown): value is ListGroupsOpen {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.active === "boolean" &&
    typeof record.upcoming === "boolean" &&
    typeof record.past === "boolean"
  );
}

/** Resolve stored preset → civil window (named presets follow the current week/month). */
export function listRangeFromPrefs(prefs: Pick<SessionOverviewPrefs, "listPreset" | "listRange">): SessionDateRange {
  if (prefs.listPreset === "custom") return prefs.listRange;
  return rangeForPreset(prefs.listPreset);
}

export function defaultSessionOverviewPrefs(): SessionOverviewPrefs {
  return {
    view: "calendar",
    statusFilter: { ...DEFAULT_SESSION_STATUS_FILTER },
    listPreset: "this_week",
    listRange: rangeForPreset("this_week"),
    // Past starts collapsed — same as previous defaultOpen={key !== "past"}.
    listGroupsOpen: { active: true, upcoming: true, past: false },
  };
}

/** Read persisted Calendar/List + status + list range; fall back to defaults. */
export function readSessionOverviewPrefs(classroomId: string): SessionOverviewPrefs {
  const defaults = defaultSessionOverviewPrefs();
  if (typeof localStorage === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(storageKey(classroomId));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<SessionOverviewPrefs>;
    const listPreset = isPreset(parsed.listPreset) ? parsed.listPreset : defaults.listPreset;
    const storedRange = isDateRange(parsed.listRange) ? parsed.listRange : defaults.listRange;
    const draft = {
      listPreset,
      listRange: listPreset === "custom" ? storedRange : rangeForPreset(listPreset),
    };
    return {
      view: isView(parsed.view) ? parsed.view : defaults.view,
      statusFilter: isStatusFilter(parsed.statusFilter)
        ? parsed.statusFilter
        : defaults.statusFilter,
      listPreset: draft.listPreset,
      listRange: draft.listRange,
      listGroupsOpen: isListGroupsOpen(parsed.listGroupsOpen)
        ? parsed.listGroupsOpen
        : defaults.listGroupsOpen,
    };
  } catch {
    return defaults;
  }
}

export function writeSessionOverviewPrefs(
  classroomId: string,
  prefs: SessionOverviewPrefs,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(classroomId), JSON.stringify(prefs));
  } catch {
    // Quota / private mode — preference is best-effort.
  }
}
