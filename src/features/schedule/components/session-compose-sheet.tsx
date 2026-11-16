import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/shared/lib/cn";
import { SessionCreate, type SessionCreateDefaults } from "./session-create";
import { WeeklySchedule } from "./weekly-schedule";

type ComposeMode = "adhoc" | "recurring";

type SessionComposeSheetProps = {
  classroomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Initial panel when the sheet opens. */
  initialMode?: ComposeMode;
  /** Prefill adhoc (and recurring start) fields — e.g. calendar day click. */
  defaults?: SessionCreateDefaults;
};

export function SessionComposeSheet({
  classroomId,
  open,
  onOpenChange,
  initialMode = "adhoc",
  defaults,
}: SessionComposeSheetProps) {
  const [mode, setMode] = useState<ComposeMode>(initialMode);
  const [dirty, setDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [canSubmitAdhoc, setCanSubmitAdhoc] = useState(false);
  const [adhocSaving, setAdhocSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setDirty(false);
      setFormKey((k) => k + 1);
      setCanSubmitAdhoc(Boolean(defaults?.sessionDate));
      setAdhocSaving(false);
    }
  }, [open, initialMode, defaults]);

  useEffect(() => {
    if (!open || !dirty) return;
    const ask = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", ask);
    return () => window.removeEventListener("beforeunload", ask);
  }, [open, dirty]);

  const onDirtyChange = useCallback((next: boolean) => {
    setDirty(next);
  }, []);

  function requestClose(nextOpen: boolean) {
    if (!nextOpen && dirty) {
      if (!window.confirm("You have unsaved changes. Discard them?")) return;
    }
    onOpenChange(nextOpen);
  }

  function switchMode(next: ComposeMode) {
    if (next === mode) return;
    if (dirty && !window.confirm("You have unsaved changes. Switch mode and discard them?")) {
      return;
    }
    setMode(next);
    setDirty(false);
    setFormKey((k) => k + 1);
    setCanSubmitAdhoc(next === "adhoc" && Boolean(defaults?.sessionDate));
    setAdhocSaving(false);
  }

  return (
    <Sheet onOpenChange={requestClose} open={open}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        data-testid="session-compose-sheet"
        side="right"
      >
        <SheetHeader className="border-b border-border/80 bg-muted/20 px-5 py-5 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarPlus aria-hidden className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <SheetTitle className="type-section">New session</SheetTitle>
              <SheetDescription>
                {mode === "adhoc"
                  ? "One-off class time · clocks are GMT+7"
                  : "Weekly pattern only — does not create sessions yet · GMT+7"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-5 py-5">
            <div
              aria-label="Session type"
              className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1"
              data-testid="compose-mode-selector"
              role="group"
            >
              <button
                aria-pressed={mode === "adhoc"}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 type-secondary font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  mode === "adhoc"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-testid="compose-mode-adhoc"
                onClick={() => switchMode("adhoc")}
                type="button"
              >
                <Plus aria-hidden className="size-3.5" />
                Adhoc
              </button>
              <button
                aria-pressed={mode === "recurring"}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 type-secondary font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  mode === "recurring"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-testid="compose-mode-recurring"
                onClick={() => switchMode("recurring")}
                type="button"
              >
                <RefreshCw aria-hidden className="size-3.5" />
                Recurring
              </button>
            </div>

            {mode === "adhoc" ? (
              <SessionCreate
                classroomId={classroomId}
                defaults={defaults}
                embedded
                key={`adhoc-${formKey}`}
                onCreated={() => {
                  // createSession already invalidates sessions (refetchType all).
                  onOpenChange(false);
                }}
                onDirtyChange={onDirtyChange}
                onReadyChange={setCanSubmitAdhoc}
                onSavingChange={setAdhocSaving}
              />
            ) : (
              <WeeklySchedule
                classroomId={classroomId}
                embedded
                initialEndTime={defaults?.endTime}
                initialStartDate={defaults?.sessionDate}
                initialStartTime={defaults?.startTime}
                key={`recurring-${formKey}`}
                onDirtyChange={onDirtyChange}
                onSaved={() => {
                  // createRecurrence invalidates sessions + recurrences.
                  onOpenChange(false);
                }}
              />
            )}
          </div>

          {mode === "adhoc" ? (
            <SheetFooter className="mt-auto border-t border-border/80 bg-background px-5 py-4">
              <Button
                className="w-full"
                data-testid="session-create-save"
                disabled={!canSubmitAdhoc || adhocSaving}
                form="session-create-form"
                type="submit"
              >
                {adhocSaving ? "Creating…" : "Create session"}
              </Button>
            </SheetFooter>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
