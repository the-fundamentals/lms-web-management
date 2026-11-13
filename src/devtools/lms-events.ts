import { EventClient } from "@tanstack/devtools-event-client";
import { getAccessToken } from "@/shared/api/token";

/** Product inspection events — suffixes only; EventClient prepends pluginId. */
export type LmsDevtoolsEvents = {
  "runtime-status": {
    path: string;
    cognitoConfigured: boolean;
    hasAccessToken: boolean;
    apiBaseConfigured: boolean;
    timestamp: number;
  };
};

class LmsDevtoolsEventClient extends EventClient<LmsDevtoolsEvents> {
  constructor() {
    super({ pluginId: "lms-web-management" });
  }
}

export const lmsDevtoolsEvents = new LmsDevtoolsEventClient();

function envConfigured(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Emit a non-secret snapshot of runtime wiring for the LMS Devtools panel. */
export function publishLmsRuntimeStatus(path: string): void {
  lmsDevtoolsEvents.emit("runtime-status", {
    path,
    cognitoConfigured:
      envConfigured(import.meta.env.VITE_COGNITO_AUTHORITY) &&
      envConfigured(import.meta.env.VITE_COGNITO_CLIENT_ID),
    hasAccessToken: getAccessToken().length > 0,
    apiBaseConfigured: envConfigured(import.meta.env.VITE_API_BASE_URL),
    timestamp: Date.now(),
  });
}
