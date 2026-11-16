import { afterEach, describe, expect, it } from "vitest";
import { rangeForPreset } from "./session-list-range";
import {
  defaultSessionOverviewPrefs,
  listRangeFromPrefs,
  readSessionOverviewPrefs,
  writeSessionOverviewPrefs,
} from "./session-overview-prefs";

describe("session overview prefs", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns defaults when nothing stored", () => {
    const defaults = defaultSessionOverviewPrefs();
    expect(readSessionOverviewPrefs("c1")).toEqual(defaults);
    expect(defaults.listPreset).toBe("this_week");
  });

  it("round-trips view, status filter, list preset, and group open", () => {
    writeSessionOverviewPrefs("c1", {
      view: "list",
      statusFilter: { OPEN: true, COMPLETED: false, CANCELLED: false },
      listPreset: "this_month",
      listRange: rangeForPreset("this_month"),
      listGroupsOpen: { active: true, upcoming: false, past: true },
    });
    const read = readSessionOverviewPrefs("c1");
    expect(read.view).toBe("list");
    expect(read.statusFilter).toEqual({ OPEN: true, COMPLETED: false, CANCELLED: false });
    expect(read.listPreset).toBe("this_month");
    expect(read.listRange).toEqual(rangeForPreset("this_month"));
    expect(read.listGroupsOpen).toEqual({ active: true, upcoming: false, past: true });
    expect(readSessionOverviewPrefs("c2")).toEqual(defaultSessionOverviewPrefs());
  });

  it("keeps custom range as stored", () => {
    writeSessionOverviewPrefs("c1", {
      ...defaultSessionOverviewPrefs(),
      view: "list",
      listPreset: "custom",
      listRange: { from: "2026-01-01", to: "2026-01-10" },
    });
    expect(readSessionOverviewPrefs("c1").listRange).toEqual({
      from: "2026-01-01",
      to: "2026-01-10",
    });
  });

  it("listRangeFromPrefs recomputes named presets", () => {
    expect(
      listRangeFromPrefs({
        listPreset: "this_week",
        listRange: { from: "2099-01-01", to: "2099-01-02" },
      }),
    ).toEqual(rangeForPreset("this_week"));
  });

  it("ignores corrupt JSON", () => {
    localStorage.setItem("lms.sessions.overview:c1", "{not-json");
    expect(readSessionOverviewPrefs("c1")).toEqual(defaultSessionOverviewPrefs());
  });
});
