import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CircleAlert, PencilLine, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { preserveTeacherText } from "@/shared/lib/text";
import { ErrorScreen } from "@/shared/ui/error-screen";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { requestFailedMessage } from "@/shared/ui/request-status";
import { renameClassroom, type ClassroomRow } from "../lib/classroom-api";
import { validateClassroomName } from "../lib/classroom-name";

type SaveStatus = "form" | "pending" | "error";

type ClassroomRenameProps = {
  classroom: ClassroomRow;
  onRenamed: (classroom: ClassroomRow) => void;
};

export function ClassroomRename({ classroom, onRenamed }: ClassroomRenameProps) {
  const [status, setStatus] = useState<SaveStatus>("form");
  const [failure, setFailure] = useState<unknown>(null);
  const [draftName, setDraftName] = useState(classroom.name);

  const form = useForm({
    defaultValues: {
      name: classroom.name,
    },
    onSubmit: async ({ value }) => {
      const checked = validateClassroomName(value.name);
      if (!checked.ok) return;
      setDraftName(checked.name);
      setStatus("pending");
      setFailure(null);
      try {
        const updated = await renameClassroom(classroom.id, checked.name);
        onRenamed(updated);
        form.reset({ name: updated.name });
        setStatus("form");
      } catch (error) {
        setFailure(error);
        setStatus("error");
      }
    },
  });

  useEffect(() => {
    form.reset({ name: classroom.name });
    setDraftName(classroom.name);
    // Reset when the loaded classroom identity/name changes — not on every form identity tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional classroom sync
  }, [classroom.id, classroom.name]);

  useEffect(() => {
    const askBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (form.state.isDirty && status !== "pending") event.preventDefault();
    };
    window.addEventListener("beforeunload", askBeforeLeaving);
    return () => window.removeEventListener("beforeunload", askBeforeLeaving);
  });

  if (status === "pending") return <LoadingScreen />;
  if (status === "error") {
    return (
      <ErrorScreen
        message={requestFailedMessage(failure)}
        onRetry={() => {
          const checked = validateClassroomName(draftName);
          if (!checked.ok) {
            setStatus("form");
            return;
          }
          setStatus("pending");
          void renameClassroom(classroom.id, checked.name)
            .then((updated) => {
              onRenamed(updated);
              form.reset({ name: updated.name });
              setStatus("form");
            })
            .catch((error: unknown) => {
              setFailure(error);
              setStatus("error");
            });
        }}
      />
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm ring-1 ring-primary/5"
      data-testid="classroom-rename"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onSubmit: ({ value }) => {
            const checked = validateClassroomName(value);
            return checked.ok ? undefined : checked.error.message;
          },
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5" htmlFor="rename-classroom-name">
              <PencilLine aria-hidden className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
              Name
            </Label>
            <Input
              aria-invalid={Boolean(field.state.meta.errorMap.onSubmit)}
              autoComplete="off"
              data-testid="rename-classroom-name"
              id="rename-classroom-name"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(event) =>
                field.handleChange(preserveTeacherText(event.target.value))
              }
              value={field.state.value}
            />
            {field.state.meta.errorMap.onSubmit ? (
              <Alert role="alert">
                <CircleAlert aria-hidden />
                <AlertDescription>{String(field.state.meta.errorMap.onSubmit)}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}
      </form.Field>

      <Button
        className="h-10 self-start transition-transform duration-200 hover:-translate-y-px"
        data-testid="rename-classroom-submit"
        disabled={status === "pending"}
        size="lg"
        type="submit"
      >
        <Save aria-hidden />
        Save name
      </Button>
    </form>
  );
}
