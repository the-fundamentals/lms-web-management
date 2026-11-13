import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/shared/lib/cn";
import {
  civilMonthRangeContaining,
  civilToLocalDate,
  civilWeekRangeContaining,
  clampCivilRangeToHorizon,
  localDateToCivil,
  maxFutureCivilDate,
  nextCivilMonthRange,
} from "../lib/calendar-month";
import type { SessionDateRange } from "../lib/session-api";
import { nowCivilInGmt7, sessionDateParts } from "../lib/session-time";

export type ListRangePreset = "this_week" | "this_month" | "next_month" | "custom";

const PRESETS: Array<{ id: Exclude<ListRangePreset, "custom">; label: string }> = [
  { id: "this_week", label: "This week" },
  { id: "this_month", label: "This month" },
  { id: "next_month", label: "Next month" },
];

export function rangeForPreset(
  preset: Exclude<ListRangePreset, "custom">,
  todayCivil: string = nowCivilInGmt7().date,
): SessionDateRange {
  if (preset === "this_week") return civilWeekRangeContaining(todayCivil);
  if (preset === "this_month") return civilMonthRangeContaining(todayCivil);
  return nextCivilMonthRange(todayCivil);
}

function formatRangeLabel(range: SessionDateRange): string {
  const from = sessionDateParts(range.from);
  const to = sessionDateParts(range.to);
  if (range.from === range.to) return from.label;
  return `${from.day} ${from.month} – ${to.day} ${to.month}`;
}

type SessionListRangeFilterProps = {
  preset: ListRangePreset;
  range: SessionDateRange;
  onPresetChange: (preset: ListRangePreset, range: SessionDateRange) => void;
};

export function SessionListRangeFilter({
  preset,
  range,
  onPresetChange,
}: SessionListRangeFilterProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const today = nowCivilInGmt7().date;
  const maxCivil = maxFutureCivilDate();
  const maxDate = useMemo(() => civilToLocalDate(maxCivil), [maxCivil]);

  const selected: DateRange = {
    from: civilToLocalDate(range.from),
    to: civilToLocalDate(range.to),
  };

  function applyPreset(next: Exclude<ListRangePreset, "custom">) {
    onPresetChange(next, rangeForPreset(next, today));
  }

  function applyCustom(next: DateRange | undefined) {
    if (!next?.from) return;
    const from = localDateToCivil(next.from);
    const to = localDateToCivil(next.to ?? next.from);
    const clamped = clampCivilRangeToHorizon({
      from: from <= to ? from : to,
      to: from <= to ? to : from,
    });
    onPresetChange("custom", clamped);
    if (next.from && next.to) setCustomOpen(false);
  }

  return (
    <div
      aria-label="List date range"
      className="flex flex-wrap items-center gap-1.5"
      data-range-from={range.from}
      data-range-to={range.to}
      data-testid="session-list-range-filter"
      role="group"
    >
      {PRESETS.map((item) => (
        <Button
          aria-pressed={preset === item.id}
          className={cn(preset === item.id && "bg-muted")}
          data-testid={`list-range-${item.id}`}
          key={item.id}
          onClick={() => applyPreset(item.id)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {item.label}
        </Button>
      ))}
      <Popover onOpenChange={setCustomOpen} open={customOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-pressed={preset === "custom"}
            className={cn(preset === "custom" && "bg-muted")}
            data-testid="list-range-custom"
            size="sm"
            type="button"
            variant="ghost"
          >
            <CalendarIcon aria-hidden />
            {preset === "custom" ? formatRangeLabel(range) : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0" data-testid="list-range-custom-popover">
          <Calendar
            disabled={{ after: maxDate }}
            mode="range"
            numberOfMonths={1}
            onSelect={applyCustom}
            selected={selected}
          />
          <p className="border-t border-border px-3 py-2 type-secondary text-muted-foreground">
            Up to {sessionDateParts(maxCivil).label} · past unlimited
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
