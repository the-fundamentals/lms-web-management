import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/cn";

type ErrorScreenProps = {
  /** What failed — e.g. “Your profile”, “This classroom”. */
  title?: string;
  message: string;
  onRetry: () => void;
  /**
   * `page` = full viewport (auth gates).
   * `section` = stays inside existing chrome (default for in-app panes).
   */
  variant?: "page" | "section";
};

export function ErrorScreen({
  title = "Something went wrong",
  message,
  onRetry,
  variant = "section",
}: ErrorScreenProps) {
  const body = (
    <div
      className={cn(
        "flex w-full max-w-md flex-col gap-4",
        variant === "section" && "rounded-2xl border border-border bg-card p-5 shadow-sm",
      )}
      data-testid="error-screen"
    >
      <Alert variant="destructive">
        <CircleAlert aria-hidden />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button
        className="w-fit"
        data-testid="error-screen-retry-button"
        onClick={onRetry}
        type="button"
      >
        Try again
      </Button>
    </div>
  );

  if (variant === "page") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
        {body}
      </div>
    );
  }

  return body;
}
