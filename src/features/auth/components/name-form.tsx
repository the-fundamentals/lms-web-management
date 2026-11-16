import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "@tanstack/react-form";
import { Camera, CircleAlert, ImagePlus, Loader2, Save, UserRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/cn";
import { fieldError } from "../../../shared/lib/screen-rules";
import { preserveTeacherText } from "../../../shared/lib/text";
import { ErrorScreen } from "../../../shared/ui/error-screen";
import { LoadingScreen } from "../../../shared/ui/loading-screen";
import { avatarKeyForSave, isPublicAvatarKey } from "../lib/avatar-key";
import { httpStatus, saveProfileName, visibleFailure } from "../lib/profile";
import { uploadPublicAvatar } from "../lib/upload-public-avatar";
import { leaveFor, markSignedOutByServer } from "../lib/session";
import { AuthShell } from "./auth-shell";
import { SignInScreen } from "./sign-in-screen";

export type NameSave = {
  avatarKey: string;
  firstName: string;
  lastName: string;
};

type NameFormProps = {
  avatarKey?: string;
  onSave: (body: NameSave) => void;
};

function revokeIfObjectUrl(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function NameForm({ avatarKey: initialAvatarKey, onSave }: NameFormProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarKey, setAvatarKey] = useState(initialAvatarKey);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProblem, setUploadProblem] = useState<string | null>(null);
  const [avatarProblem, setAvatarProblem] = useState<string | null>(null);
  const hasPhoto = Boolean(previewUrl) || isPublicAvatarKey(avatarKey);
  const photoRequired = !isPublicAvatarKey(initialAvatarKey);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
    },
    onSubmit: ({ value }) => {
      if (uploading) return;
      const key = avatarKeyForSave(avatarKey);
      if (!key) {
        setAvatarProblem(
          fieldError(
            {
              "first name": value.firstName,
              "last name": value.lastName,
              "profile picture": "",
            },
            "profile picture",
            "is required",
          ).message,
        );
        return;
      }
      setAvatarProblem(null);
      onSave({
        avatarKey: key,
        firstName: preserveTeacherText(value.firstName),
        lastName: preserveTeacherText(value.lastName),
      });
    },
  });

  useEffect(() => {
    return () => {
      revokeIfObjectUrl(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const askBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (form.state.isDirty || Boolean(previewUrl) || avatarKey !== initialAvatarKey) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", askBeforeLeaving);
    return () => window.removeEventListener("beforeunload", askBeforeLeaving);
  });

  async function onAvatarPicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    revokeIfObjectUrl(previewUrl);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploadProblem(null);
    setAvatarProblem(null);
    setUploading(true);
    try {
      const uploaded = await uploadPublicAvatar(file);
      setAvatarKey(uploaded.objectKey);
      if (uploaded.downloadUrl) {
        revokeIfObjectUrl(localPreview);
        setPreviewUrl(uploaded.downloadUrl);
      }
    } catch (error) {
      revokeIfObjectUrl(localPreview);
      setPreviewUrl(null);
      setAvatarKey(initialAvatarKey);
      setUploadProblem(visibleFailure(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <AuthShell
      description="Add your name and an optional photo so teachers and staff recognize you."
      title="Your name"
    >
      <form
        className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm ring-1 ring-primary/5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <button
            aria-label="Upload profile picture"
            className={cn(
              "group relative size-28 overflow-hidden rounded-full border border-border bg-muted",
              "shadow-sm ring-1 ring-primary/10",
              "transition-transform duration-200 hover:-translate-y-px focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              "disabled:pointer-events-none disabled:opacity-70",
            )}
            data-testid="avatar-picker"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {previewUrl ? (
              <img alt="" className="size-full object-cover" src={previewUrl} />
            ) : (
              <span className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                <ImagePlus aria-hidden className="size-7" strokeWidth={1.5} />
                <span className="type-secondary">{hasPhoto ? "Photo" : "Add"}</span>
              </span>
            )}
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "bg-primary/35 text-primary-foreground opacity-0 transition-opacity",
                "group-hover:opacity-100 group-disabled:opacity-0",
              )}
            >
              {uploading ? (
                <Loader2 className="size-6 animate-spin" strokeWidth={1.75} />
              ) : (
                <Camera className="size-6" strokeWidth={1.75} />
              )}
            </span>
            {uploading && previewUrl ? (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center bg-background/50"
              >
                <Loader2 className="size-6 animate-spin text-primary" strokeWidth={1.75} />
              </span>
            ) : null}
          </button>
          <input
            accept="image/*"
            className="sr-only"
            data-testid="avatar-file"
            id={fileInputId}
            onChange={(event) => void onAvatarPicked(event)}
            ref={fileInputRef}
            type="file"
          />
          <Label
            className="flex items-center gap-1.5 type-secondary text-muted-foreground"
            htmlFor={fileInputId}
          >
            {uploading ? (
              <>
                <Loader2 aria-hidden className="size-3.5 animate-spin" />
                Uploading photo…
              </>
            ) : hasPhoto ? (
              <>
                <Camera aria-hidden className="size-3.5 text-primary" />
                Profile picture ready
              </>
            ) : photoRequired ? (
              <>
                <ImagePlus aria-hidden className="size-3.5" />
                Profile picture (required)
              </>
            ) : (
              <>
                <ImagePlus aria-hidden className="size-3.5" />
                Profile picture (optional)
              </>
            )}
          </Label>
          {uploadProblem ? (
            <Alert>
              <CircleAlert aria-hidden />
              <AlertDescription>{uploadProblem}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <form.Field
            name="firstName"
            validators={{
              onSubmit: ({ value }) =>
                value.trim().length === 0
                  ? fieldError(
                      { "first name": value, "last name": "" },
                      "first name",
                      "is required",
                    ).message
                  : undefined,
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-1.5" htmlFor="first-name">
                  <UserRound aria-hidden className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                  First name
                </Label>
                <Input
                  aria-invalid={Boolean(field.state.meta.errorMap.onSubmit)}
                  autoComplete="given-name"
                  data-testid="first-name"
                  id="first-name"
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
          <form.Field
            name="lastName"
            validators={{
              onSubmit: ({ value }) =>
                value.trim().length === 0
                  ? fieldError(
                      { "first name": "", "last name": value },
                      "last name",
                      "is required",
                    ).message
                  : undefined,
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-1.5" htmlFor="last-name">
                  <UserRound aria-hidden className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                  Last name
                </Label>
                <Input
                  aria-invalid={Boolean(field.state.meta.errorMap.onSubmit)}
                  autoComplete="family-name"
                  data-testid="last-name"
                  id="last-name"
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
        </div>

        {avatarProblem ? (
          <Alert role="alert">
            <CircleAlert aria-hidden />
            <AlertDescription>{avatarProblem}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="h-10 w-full transition-transform duration-200 hover:-translate-y-px"
          data-testid="save-name"
          disabled={uploading}
          size="lg"
          type="submit"
        >
          <Save aria-hidden />
          Save
        </Button>
      </form>
    </AuthShell>
  );
}

type SaveStatus = "form" | "pending" | "error" | "signed-out" | "done";

export function OnboardingScreen({
  avatarKey,
  onSignIn = () => undefined,
}: {
  avatarKey?: string;
  onSignIn?: () => void;
}) {
  const [status, setStatus] = useState<SaveStatus>("form");
  const [failure, setFailure] = useState<unknown>(null);
  const [draft, setDraft] = useState<NameSave | null>(null);

  async function submit(body: NameSave) {
    setDraft(body);
    setStatus("pending");
    try {
      await saveProfileName(body);
      leaveFor("/");
      setStatus("done");
    } catch (error) {
      if (httpStatus(error) === 401) {
        markSignedOutByServer();
        setStatus("signed-out");
        return;
      }
      setFailure(error);
      setStatus("error");
    }
  }

  if (status === "pending" || status === "done") {
    return <LoadingScreen hint="Saving your profile" label="Almost there" />;
  }
  if (status === "signed-out") return <SignInScreen notice="unsaved" onSignIn={onSignIn} />;
  if (status === "error") {
    return (
      <ErrorScreen
        message={visibleFailure(failure)}
        onRetry={() => {
          if (draft) void submit(draft);
        }}
        title="Couldn't save your profile"
        variant="page"
      />
    );
  }
  return <NameForm avatarKey={avatarKey} onSave={(body) => void submit(body)} />;
}
