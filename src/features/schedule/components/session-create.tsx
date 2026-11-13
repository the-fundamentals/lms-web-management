import { useEffect, useState, type FormEvent } from "react";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestFailedMessage } from "@/shared/ui/request-status";
import { createSession } from "../lib/session-api";

export type SessionCreateDefaults = {
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  name?: string;
};

type SessionCreateProps = {
  classroomId: string;
  /** Form-only — used inside SessionComposeSheet. */
  embedded?: boolean;
  defaults?: SessionCreateDefaults;
  onCreated?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** Embedded: parent sticky footer needs date readiness. */
  onReadyChange?: (ready: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
};

export function SessionCreate({
  classroomId,
  embedded = false,
  defaults,
  onCreated,
  onDirtyChange,
  onReadyChange,
  onSavingChange,
}: SessionCreateProps) {
  const navigate = useNavigate();
  const [sessionDate, setSessionDate] = useState(defaults?.sessionDate ?? "");
  const [startTime, setStartTime] = useState(defaults?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(defaults?.endTime ?? "10:00");
  const [name, setName] = useState(defaults?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const dirty = Boolean(sessionDate || name.trim());

  useEffect(() => {
    onDirtyChange?.(dirty && !saving);
  }, [dirty, saving, onDirtyChange]);

  useEffect(() => {
    onReadyChange?.(Boolean(sessionDate));
  }, [sessionDate, onReadyChange]);

  useEffect(() => {
    onSavingChange?.(saving);
  }, [saving, onSavingChange]);

  // FR7.4 — page only; compose sheet owns leave prompts when embedded.
  useBlocker({
    shouldBlockFn: () => {
      if (embedded || !dirty || saving) return false;
      return !window.confirm("You have unsaved changes. Leave this page?");
    },
    enableBeforeUnload: !embedded && dirty && !saving,
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving || !sessionDate) return;
    setSaving(true);
    setFailure(null);
    try {
      await createSession(classroomId, {
        sessionDate,
        startTime,
        endTime,
        ...(name.trim() ? { name: name.trim() } : {}),
      });
      if (embedded) {
        onCreated?.();
        setSaving(false);
      } else {
        await navigate({
          to: "/classrooms/$classroomId/sessions",
          params: { classroomId },
        });
      }
    } catch (error) {
      setFailure(error);
      setSaving(false);
    }
  }

  const fields = (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="session-date">Date</Label>
        <Input
          data-testid="session-date"
          id="session-date"
          onChange={(e) => setSessionDate(e.target.value)}
          required
          type="date"
          value={sessionDate}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session-start">Start</Label>
          <Input
            data-testid="session-start"
            id="session-start"
            onChange={(e) => setStartTime(e.target.value)}
            required
            type="time"
            value={startTime}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session-end">End</Label>
          <Input
            data-testid="session-end"
            id="session-end"
            onChange={(e) => setEndTime(e.target.value)}
            required
            type="time"
            value={endTime}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="session-name">Name</Label>
        <Input
          data-testid="session-name"
          id="session-name"
          onChange={(e) => setName(e.target.value)}
          placeholder="Optional title"
          value={name}
        />
      </div>
      {failure ? (
        <Alert data-testid="session-create-error" variant="destructive">
          <CircleAlert />
          <AlertDescription>{requestFailedMessage(failure)}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <form
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
        data-testid="session-create-form"
        id="session-create-form"
        onSubmit={(e) => void onSubmit(e)}
      >
        <div className="space-y-1">
          <p className="type-body font-medium text-foreground">When</p>
          <p className="type-secondary text-muted-foreground">
            Civil date and local clock in GMT+7.
          </p>
        </div>
        {fields}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="session-create">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="type-section text-foreground">New session</p>
          <p className="type-secondary text-muted-foreground">
            Date and clock times are GMT+7.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link
            data-testid="session-create-back"
            params={{ classroomId }}
            to="/classrooms/$classroomId/sessions"
          >
            <ArrowLeft aria-hidden />
            Back
          </Link>
        </Button>
      </div>
      <form
        className="flex max-w-lg flex-col gap-3"
        data-testid="session-create-form"
        onSubmit={(e) => void onSubmit(e)}
      >
        {fields}
        <Button data-testid="session-create-save" disabled={saving || !sessionDate} type="submit">
          {saving ? "Creating…" : "Create session"}
        </Button>
      </form>
    </div>
  );
}
