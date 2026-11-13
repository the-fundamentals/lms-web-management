import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useBlocker } from "@tanstack/react-router";
import { ArrowLeft, CircleAlert, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecurrenceByDay } from "@/generated/types.gen";
import { requestFailedMessage } from "@/shared/ui/request-status";
import { RequestStatus } from "@/shared/ui/request-status";
import {
  createRecurrence,
  deleteRecurrence,
  recurrencesQueryOptions,
} from "../lib/session-api";
import { formatSessionClockRange, sessionDateParts } from "../lib/session-time";

function recurrenceDayShort(byDay: RecurrenceByDay): string {
  return byDay.charAt(0) + byDay.slice(1, 3).toLowerCase();
}

type WeeklyScheduleProps = {
  classroomId: string;
  /** Form-only — used inside SessionComposeSheet. */
  embedded?: boolean;
  /** When embedded, pause the query until the recurring panel is shown. */
  active?: boolean;
  /** Prefill recurrence start date (e.g. from calendar day). */
  initialStartDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  onDirtyChange?: (dirty: boolean) => void;
  /** Embedded: after a successful save (calendar/list already invalidated in API). */
  onSaved?: () => void;
};

const DAYS: RecurrenceByDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export function WeeklySchedule({
  classroomId,
  embedded = false,
  active = true,
  initialStartDate,
  initialStartTime,
  initialEndTime,
  onDirtyChange,
  onSaved,
}: WeeklyScheduleProps) {
  const query = useQuery({
    ...recurrencesQueryOptions(classroomId),
    enabled: active,
  });
  const [byDays, setByDays] = useState<RecurrenceByDay[]>([]);
  const [startDate, setStartDate] = useState(initialStartDate ?? "");
  const [startTime, setStartTime] = useState(initialStartTime ?? "09:00");
  const [endTime, setEndTime] = useState(initialEndTime ?? "10:00");
  const [failure, setFailure] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const dirty = byDays.length > 0 || startDate.length > 0;

  useEffect(() => {
    onDirtyChange?.(dirty && !savingRef.current);
  }, [dirty, saving, onDirtyChange]);

  // FR7.4 — page only; compose sheet owns leave prompts when embedded.
  useBlocker({
    shouldBlockFn: () => {
      if (embedded || !dirty || savingRef.current) return false;
      return !window.confirm("You have unsaved changes. Leave this page?");
    },
    enableBeforeUnload: !embedded && dirty,
  });

  const save = useMutation({
    mutationFn: () =>
      createRecurrence(classroomId, {
        byDays,
        recurrenceStartDate: startDate,
        startTime,
        endTime,
      }),
    onSuccess: async () => {
      setByDays([]);
      setStartDate("");
      setFailure(null);
      savingRef.current = false;
      setSaving(false);
      await query.refetch();
      onSaved?.();
    },
    onError: (error) => {
      setFailure(error);
      savingRef.current = false;
      setSaving(false);
    },
  });

  function toggleDay(day: RecurrenceByDay) {
    setByDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  const body = (
    <div className="flex flex-col gap-4" data-testid="weekly-schedule-body">
      <div
        className={
          embedded
            ? "rounded-2xl border border-border bg-card p-4 shadow-sm"
            : undefined
        }
      >
        <RequestStatus
          error={query.error}
          onRetry={() => {
            void query.refetch();
          }}
          status={query.isPending ? "pending" : query.isError ? "error" : "success"}
        >
          {embedded ? (
            <div className="mb-3 space-y-1">
              <p className="type-body font-medium text-foreground">Saved patterns</p>
              <p className="type-secondary text-muted-foreground">
                Existing weekly rows for this classroom.
              </p>
            </div>
          ) : null}
          <ul className="flex flex-col gap-2" data-testid="weekly-list">
            {(query.data ?? []).length === 0 ? (
              <li className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-4 text-center type-secondary text-muted-foreground">
                No weekly times yet.
              </li>
            ) : (
              (query.data ?? []).map((row) => {
                const start = sessionDateParts(row.recurrenceStartDate);
                const clock = formatSessionClockRange(
                  row.recurrenceStartDate,
                  row.startTime,
                  row.endTime,
                );
                return (
                  <li
                    className="group flex items-center gap-3 rounded-xl border border-border/80 bg-background px-2.5 py-2 shadow-sm"
                    data-testid={`weekly-row-${row.id}`}
                    key={row.id}
                  >
                    <span
                      aria-hidden
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 type-body font-medium text-primary"
                    >
                      {recurrenceDayShort(row.byDay)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block type-body font-medium tabular-nums text-foreground">
                        {clock}
                      </span>
                      <span className="mt-0.5 block type-secondary text-muted-foreground">
                        Every week · from {start.day} {start.month}
                      </span>
                    </span>
                    <Button
                      className="shrink-0 text-muted-foreground opacity-70 transition-opacity hover:bg-destructive/10 hover:text-destructive hover:opacity-100 group-hover:opacity-100"
                      data-testid={`weekly-delete-${row.id}`}
                      onClick={() => {
                        void deleteRecurrence(classroomId, row.id).then(() => query.refetch());
                      }}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden />
                      <span className="sr-only">Delete weekly time</span>
                    </Button>
                  </li>
                );
              })
            )}
          </ul>
        </RequestStatus>
      </div>

      <form
        className={
          embedded
            ? "flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
            : "flex flex-col gap-3 rounded-xl border border-border p-4"
        }
        data-testid="weekly-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (savingRef.current || byDays.length === 0 || !startDate) return;
          savingRef.current = true;
          setSaving(true);
          save.mutate();
        }}
      >
        <div className="space-y-1">
          <p className="type-body font-medium text-foreground">Add weekly time</p>
          {embedded ? (
            <p className="type-secondary text-muted-foreground">
              Pick days, start date, and the clock range.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const checked = byDays.includes(day);
            return (
              <label
                className={
                  checked
                    ? "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 type-secondary font-medium text-primary"
                    : "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 type-secondary text-muted-foreground hover:text-foreground"
                }
                key={day}
              >
                <input
                  checked={checked}
                  className="sr-only"
                  data-testid={`weekly-day-${day}`}
                  onChange={() => toggleDay(day)}
                  type="checkbox"
                />
                {day.slice(0, 3)}
              </label>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <Label htmlFor="weekly-start-date">Start date</Label>
            <Input
              data-testid="weekly-start-date"
              id="weekly-start-date"
              onChange={(e) => setStartDate(e.target.value)}
              type="date"
              value={startDate}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weekly-start-time">Start</Label>
            <Input
              data-testid="weekly-start-time"
              id="weekly-start-time"
              onChange={(e) => setStartTime(e.target.value)}
              type="time"
              value={startTime}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weekly-end-time">End</Label>
            <Input
              data-testid="weekly-end-time"
              id="weekly-end-time"
              onChange={(e) => setEndTime(e.target.value)}
              type="time"
              value={endTime}
            />
          </div>
        </div>
        {failure ? (
          <Alert data-testid="weekly-error" variant="destructive">
            <CircleAlert />
            <AlertDescription>{requestFailedMessage(failure)}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          className={embedded ? "w-full" : undefined}
          data-testid="weekly-save"
          disabled={saving || byDays.length === 0 || !startDate}
          type="submit"
        >
          {saving ? "Saving…" : "Save weekly time"}
        </Button>
      </form>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <div className="flex flex-col gap-4" data-testid="weekly-schedule">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="type-section text-foreground">Weekly time</p>
          <p className="type-secondary text-muted-foreground">
            Saves recurrence rows only — does not create sessions. GMT+7.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link
            data-testid="weekly-back"
            params={{ classroomId }}
            to="/classrooms/$classroomId/sessions"
          >
            <ArrowLeft aria-hidden />
            Back to sessions
          </Link>
        </Button>
      </div>
      {body}
    </div>
  );
}
