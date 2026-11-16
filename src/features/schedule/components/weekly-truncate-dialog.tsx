import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { X } from "lucide-react";
import type { DayButton } from "react-day-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/cn";
import { civilDateInGmt7 } from "@/shared/lib/gmt7";
import { civilToLocalDate, localDateToCivil } from "../lib/calendar-month";
import type { RecurrenceRow } from "../lib/session-api";
import { formatSessionClockRange, sessionDateParts } from "../lib/session-time";
import {
  isCancelledOccurrence,
  isCutoffForward,
  isRecurrenceOccurrence,
} from "../lib/truncate-calendar";

type WeeklyTruncateDialogProps = {
  row: RecurrenceRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (cutoffDate: string) => void;
  pending?: boolean;
};

function dayShort(byDay: string): string {
  return byDay.charAt(0) + byDay.slice(1, 3).toLowerCase();
}

function TruncateDayButton({
  className,
  modifiers,
  ...props
}: ComponentProps<typeof DayButton>) {
  const cancelled = Boolean(modifiers.cancelled);
  return (
    <CalendarDayButton
      className={cn(
        className,
        modifiers.recurrence &&
          !cancelled &&
          "bg-primary/15 font-semibold text-primary data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        modifiers.afterCutoff && !cancelled && "rounded-none bg-muted/60",
        cancelled &&
          "bg-destructive/15 font-semibold text-destructive data-[selected-single=true]:bg-destructive data-[selected-single=true]:text-destructive-foreground",
      )}
      data-cancelled={cancelled || undefined}
      modifiers={modifiers}
      {...props}
    >
      {cancelled ? (
        <span className="relative flex size-full items-center justify-center">
          <span className="opacity-35">{props.children}</span>
          <X aria-hidden className="absolute size-3.5 stroke-[2.5]" />
        </span>
      ) : (
        props.children
      )}
    </CalendarDayButton>
  );
}

export function WeeklyTruncateDialog({
  row,
  open,
  onOpenChange,
  onConfirm,
  pending = false,
}: WeeklyTruncateDialogProps) {
  const [cutoffDate, setCutoffDate] = useState(() => civilDateInGmt7(new Date()));
  const [month, setMonth] = useState(() => civilToLocalDate(civilDateInGmt7(new Date())));

  useEffect(() => {
    if (!open) return;
    const today = civilDateInGmt7(new Date());
    setCutoffDate(today);
    setMonth(civilToLocalDate(today));
  }, [open]);

  const selected = useMemo(() => civilToLocalDate(cutoffDate), [cutoffDate]);
  const cutoffLabel = sessionDateParts(cutoffDate).label;

  const modifiers = useMemo(() => {
    if (!row) return {};
    const { byDay, recurrenceStartDate } = row;
    return {
      recurrence: (date: Date) => {
        const civil = localDateToCivil(date);
        return (
          isRecurrenceOccurrence(civil, byDay, recurrenceStartDate) &&
          !isCutoffForward(civil, cutoffDate)
        );
      },
      afterCutoff: (date: Date) => isCutoffForward(localDateToCivil(date), cutoffDate),
      cancelled: (date: Date) =>
        isCancelledOccurrence(localDateToCivil(date), byDay, recurrenceStartDate, cutoffDate),
    };
  }, [row, cutoffDate]);

  const clock = row
    ? formatSessionClockRange(row.recurrenceStartDate, row.startTime, row.endTime)
    : "";
  const day = row ? dayShort(row.byDay) : "";

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent data-testid="weekly-truncate-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Stop weekly time?</AlertDialogTitle>
          <AlertDialogDescription>
            {row
              ? `${day} ${clock} ends from the cutoff date onward. OPEN sessions on or after that date are cancelled. Past and completed sessions stay.`
              : "OPEN sessions on or after the cutoff are cancelled."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 px-1">
          <div className="flex items-baseline justify-between gap-2">
            <Label>Cutoff date (GMT+7)</Label>
            <p
              className="type-body font-medium tabular-nums text-foreground"
              data-testid="weekly-truncate-cutoff-label"
            >
              {cutoffLabel}
            </p>
          </div>
          <div
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/20 p-1 pb-2"
            data-cutoff-date={cutoffDate}
            data-testid="weekly-truncate-cutoff"
          >
            <Calendar
              components={{ DayButton: TruncateDayButton }}
              mode="single"
              modifiers={modifiers}
              modifiersClassNames={{
                afterCutoff: "bg-muted/50 [&:not([data-selected])]:rounded-none",
              }}
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                if (!date) return;
                setCutoffDate(localDateToCivil(date));
                setMonth(date);
              }}
              selected={selected}
            />
            {row ? (
              <p className="px-2 text-center type-secondary text-muted-foreground">
                Every <span className="font-medium text-primary">{day}</span> kept before cutoff ·
                wash from cutoff · matching days{" "}
                <span className="font-medium text-destructive">× cancelled</span>
              </p>
            ) : null}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="weekly-truncate-cancel" disabled={pending}>
            Keep
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="weekly-truncate-confirm"
            disabled={pending || !row || !cutoffDate}
            onClick={(event) => {
              event.preventDefault();
              if (!cutoffDate) return;
              onConfirm(cutoffDate);
            }}
          >
            {pending ? "Stopping…" : "Stop from cutoff"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
