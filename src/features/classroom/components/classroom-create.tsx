import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  CircleAlert,
  ImagePlus,
  Loader2,
  PencilLine,
  Plus,
  Wallet,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoneyDigits } from "@/shared/lib/money";
import { preserveTeacherText } from "@/shared/lib/text";
import { cn } from "@/shared/lib/cn";
import { ErrorScreen } from "@/shared/ui/error-screen";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { MoneyInput } from "@/shared/ui/money-input";
import { requestFailedMessage } from "@/shared/ui/request-status";
import { isPublicBannerKey } from "../lib/banner-key";
import { createClassroomNamed } from "../lib/classroom-api";
import { validateClassroomName } from "../lib/classroom-name";
import {
  DEFAULT_PAYMENT_PLAN_TYPE,
  validateBasePaymentPlan,
} from "../lib/classroom-payment";
import { uploadPublicBanner } from "../lib/upload-public-banner";

type SaveStatus = "form" | "pending" | "error";

function revokeIfObjectUrl(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function ClassroomCreate() {
  const navigate = useNavigate();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerKey, setBannerKey] = useState<string | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProblem, setUploadProblem] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("form");
  const [failure, setFailure] = useState<unknown>(null);
  const [draft, setDraft] = useState<{
    name: string;
    bannerKey?: string;
    basePaymentPlan?: { amount: number; type: typeof DEFAULT_PAYMENT_PLAN_TYPE };
  } | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      amount: "0",
    },
    onSubmit: async ({ value }) => {
      if (status === "pending" || uploading) return;
      const checkedName = validateClassroomName(value.name);
      if (!checkedName.ok) return;
      const trimmed = value.amount.trim();
      let basePaymentPlan:
        | { amount: number; type: typeof DEFAULT_PAYMENT_PLAN_TYPE }
        | undefined;
      if (trimmed.length > 0 && trimmed !== "0") {
        const checkedPlan = validateBasePaymentPlan(value.amount, DEFAULT_PAYMENT_PLAN_TYPE);
        if (!checkedPlan.ok) return;
        basePaymentPlan = checkedPlan.plan;
      }
      const input = {
        name: checkedName.name,
        ...(isPublicBannerKey(bannerKey) ? { bannerKey } : {}),
        ...(basePaymentPlan ? { basePaymentPlan } : {}),
      };
      setDraft(input);
      setStatus("pending");
      setFailure(null);
      try {
        await createClassroomNamed(input);
        await navigate({ to: "/classrooms" });
      } catch (error) {
        setFailure(error);
        setStatus("error");
      }
    },
  });

  useEffect(() => {
    return () => {
      revokeIfObjectUrl(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const askBeforeLeaving = (event: BeforeUnloadEvent) => {
      const dirty =
        form.state.isDirty || Boolean(previewUrl) || Boolean(bannerKey);
      if (dirty && status !== "pending") event.preventDefault();
    };
    window.addEventListener("beforeunload", askBeforeLeaving);
    return () => window.removeEventListener("beforeunload", askBeforeLeaving);
  });

  async function onBannerPicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    revokeIfObjectUrl(previewUrl);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploadProblem(null);
    setUploading(true);
    try {
      const uploaded = await uploadPublicBanner(file);
      setBannerKey(uploaded.objectKey);
      if (uploaded.downloadUrl) {
        revokeIfObjectUrl(localPreview);
        setPreviewUrl(uploaded.downloadUrl);
      }
    } catch (error) {
      revokeIfObjectUrl(localPreview);
      setPreviewUrl(null);
      setBannerKey(undefined);
      setUploadProblem(
        error instanceof Error && error.message ? error.message : "The image could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  }

  if (status === "pending") return <LoadingScreen />;
  if (status === "error") {
    return (
      <ErrorScreen
        message={requestFailedMessage(failure)}
        onRetry={() => {
          if (!draft) {
            setStatus("form");
            return;
          }
          setStatus("pending");
          void createClassroomNamed(draft)
            .then(() => navigate({ to: "/classrooms" }))
            .catch((error: unknown) => {
              setFailure(error);
              setStatus("error");
            });
        }}
      />
    );
  }

  return (
    <div
      className="relative mx-auto flex w-full max-w-2xl flex-col gap-8"
      data-testid="classroom-create-page"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 -top-4 h-40 rounded-3xl bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_70%)]"
      />

      <header className="animate-in fade-in slide-in-from-bottom-2 relative flex flex-col gap-3 duration-500 fill-mode-both">
        <p className="type-secondary tracking-[0.16em] text-muted-foreground uppercase">
          New classroom
        </p>
        <h2 className="type-page text-foreground text-balance">Set up your next class</h2>
        <span aria-hidden className="h-0.5 w-12 rounded-full bg-primary/70" />
        <p className="type-body max-w-lg text-muted-foreground">
          Give it a clear name. Banner and payment plan are optional — you can fill those in
          later.
        </p>
      </header>

      <form
        className={cn(
          "animate-in fade-in slide-in-from-bottom-3 relative flex flex-col gap-8 duration-700 fill-mode-both delay-75",
          "rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm",
          "ring-1 ring-primary/5 md:p-8",
        )}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="type-section text-foreground">Essentials</h3>
            <span className="type-secondary text-muted-foreground">Required</span>
          </div>
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
                <Label className="flex items-center gap-1.5" htmlFor="classroom-name">
                  <PencilLine
                    aria-hidden
                    className="size-3.5 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  Name
                </Label>
                <Input
                  aria-invalid={Boolean(field.state.meta.errorMap.onSubmit)}
                  autoComplete="off"
                  className="h-11 text-base md:text-sm"
                  data-testid="classroom-name"
                  id="classroom-name"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(preserveTeacherText(event.target.value))
                  }
                  placeholder="e.g. Algebra I — Tuesday cohort"
                  value={field.state.value}
                />
                {field.state.meta.errorMap.onSubmit ? (
                  <Alert role="alert">
                    <CircleAlert aria-hidden />
                    <AlertDescription>
                      {String(field.state.meta.errorMap.onSubmit)}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            )}
          </form.Field>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="type-section text-foreground">Banner</h3>
            <span className="type-secondary text-muted-foreground">Optional</span>
          </div>
          <input
            accept="image/*"
            className="sr-only"
            data-testid="classroom-banner-file"
            id={fileInputId}
            onChange={(event) => void onBannerPicked(event)}
            ref={fileInputRef}
            type="file"
          />
          <button
            className={cn(
              "group relative flex min-h-44 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-border bg-muted/25 p-6 text-center",
              "transition-[border-color,background-color,transform] duration-200",
              "hover:border-primary/40 hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              "disabled:pointer-events-none disabled:opacity-70",
              previewUrl && "border-solid border-border p-0",
            )}
            data-testid="classroom-banner-picker"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {previewUrl ? (
              <>
                <img
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  data-testid="classroom-banner-preview"
                  src={previewUrl}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                <span className="relative z-10 mt-auto flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-sm text-foreground shadow-sm ring-1 ring-border">
                  {uploading ? (
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus aria-hidden className="size-4 text-primary" />
                  )}
                  {uploading ? "Uploading…" : "Change banner"}
                </span>
              </>
            ) : (
              <>
                <span className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm ring-1 ring-primary/15">
                  {uploading ? (
                    <Loader2 aria-hidden className="size-5 animate-spin" />
                  ) : (
                    <ImagePlus aria-hidden className="size-5" strokeWidth={1.75} />
                  )}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {uploading ? "Uploading banner…" : "Drop in a cover image"}
                  </span>
                  <span className="type-secondary text-muted-foreground">
                    Shown on the classroom list and detail header
                  </span>
                </span>
              </>
            )}
          </button>
          {uploadProblem ? (
            <Alert>
              <CircleAlert aria-hidden />
              <AlertDescription>{uploadProblem}</AlertDescription>
            </Alert>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="type-section text-foreground">Payment</h3>
            <span className="type-secondary text-muted-foreground">Optional</span>
          </div>
          <form.Subscribe selector={(state) => state.values.amount}>
            {(amount) => {
              const planSummary =
                amount.trim() === "" || amount.trim() === "0"
                  ? "None (free)"
                  : `Per session · ${formatMoneyDigits(amount.trim())} VND`;
              return (
                <div
                  className="overflow-hidden rounded-xl border border-dashed border-border/80 bg-muted/20"
                  data-testid="classroom-plan-panel"
                >
                  <button
                    aria-controls="classroom-plan-fields"
                    aria-expanded={planOpen}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                    data-testid="classroom-plan-toggle"
                    onClick={() => setPlanOpen((open) => !open)}
                    type="button"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                      <Wallet aria-hidden className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        Base payment plan
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Currently {planSummary}. Open only if students pay per session.
                      </span>
                    </span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        planOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {planOpen ? (
                    <div
                      className="grid gap-4 border-t border-border/70 bg-background/40 px-4 py-4 sm:grid-cols-2"
                      id="classroom-plan-fields"
                    >
                      <div className="flex flex-col gap-2">
                        <Label className="text-muted-foreground" htmlFor="classroom-plan-type">
                          Payment type
                        </Label>
                        <Input
                          data-testid="classroom-plan-type"
                          disabled
                          id="classroom-plan-type"
                          readOnly
                          value="Per session"
                        />
                      </div>
                      <form.Field
                        name="amount"
                        validators={{
                          onSubmit: ({ value }) => {
                            const trimmed = value.trim();
                            if (trimmed.length === 0 || trimmed === "0") return undefined;
                            const checked = validateBasePaymentPlan(
                              value,
                              DEFAULT_PAYMENT_PLAN_TYPE,
                            );
                            return checked.ok ? undefined : checked.error.message;
                          },
                        }}
                      >
                        {(field) => (
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="classroom-plan-amount">Amount (0 = free)</Label>
                            <MoneyInput
                              aria-invalid={Boolean(field.state.meta.errorMap.onSubmit)}
                              data-testid="classroom-plan-amount"
                              id="classroom-plan-amount"
                              onValueChange={(digits) => field.handleChange(digits)}
                              value={field.state.value}
                            />
                            {field.state.meta.errorMap.onSubmit ? (
                              <Alert role="alert">
                                <CircleAlert aria-hidden />
                                <AlertDescription>
                                  {String(field.state.meta.errorMap.onSubmit)}
                                </AlertDescription>
                              </Alert>
                            ) : null}
                          </div>
                        )}
                      </form.Field>
                    </div>
                  ) : null}
                </div>
              );
            }}
          </form.Subscribe>
        </section>

        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-secondary text-muted-foreground">
            You can rename and adjust details after creating.
          </p>
          <Button
            className="h-11 w-full transition-transform duration-200 hover:-translate-y-px sm:w-auto sm:min-w-48"
            data-testid="create-classroom-submit"
            disabled={status === "pending" || uploading}
            size="lg"
            type="submit"
          >
            <Plus aria-hidden />
            Create classroom
          </Button>
        </div>
      </form>
    </div>
  );
}
