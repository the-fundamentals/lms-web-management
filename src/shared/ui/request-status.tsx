import type { ReactNode } from "react";
import { RequestTimeoutError } from "../api/client";
import { ErrorScreen } from "./error-screen";
import { LoadingScreen } from "./loading-screen";
import { SectionLoadingSkeleton } from "./section-loading-skeleton";

export function requestFailedMessage(error: unknown): string {
  if (error instanceof RequestTimeoutError) return error.message;
  if (error instanceof Error && error.message.length > 0) return error.message;
  return "The request failed";
}

type RequestStatusProps = {
  children?: ReactNode;
  error?: unknown;
  onRetry: () => void;
  status: "pending" | "error" | "success";
  /** Human label for what this request loads — shown on error. */
  title?: string;
  /**
   * `page` — full-viewport loading/error (auth / hard gates).
   * `section` — keep surrounding chrome; compact loading/error (default).
   */
  variant?: "page" | "section";
  /** Section pending UI — defaults to a content skeleton. */
  pending?: ReactNode;
};

// Pending stays on loading. Failure shows a titled error with retry — scoped by `variant`.
export function RequestStatus({
  children,
  error,
  onRetry,
  status,
  title,
  variant = "section",
  pending,
}: RequestStatusProps) {
  if (status === "pending") {
    if (variant === "page") return <LoadingScreen />;
    if (pending !== undefined) return pending;
    return <SectionLoadingSkeleton />;
  }
  if (status === "error") {
    return (
      <ErrorScreen
        message={requestFailedMessage(error)}
        onRetry={onRetry}
        title={title ?? "Something went wrong"}
        variant={variant}
      />
    );
  }
  return children;
}
