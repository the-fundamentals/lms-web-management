import type { ReactNode } from "react";
import { RequestTimeoutError } from "../api/client";
import { ErrorScreen } from "./error-screen";
import { LoadingScreen } from "./loading-screen";

export function requestFailedMessage(error: unknown): string {
  if (error instanceof RequestTimeoutError) return error.message;
  if (error instanceof Error && error.message.length > 0) return error.message;
  return "The request failed";
}

// Pending stays on the loading screen. A timeout or other failure leaves it and shows the error screen with retry.
export function RequestStatus({
  children,
  error,
  onRetry,
  status,
}: {
  children?: ReactNode;
  error?: unknown;
  onRetry: () => void;
  status: "pending" | "error" | "success";
}) {
  if (status === "pending") return <LoadingScreen />;
  if (status === "error") return <ErrorScreen message={requestFailedMessage(error)} onRetry={onRetry} />;
  return children;
}
