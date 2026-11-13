import { useEffect, useState } from "react";
import { lmsDevtoolsEvents, type LmsDevtoolsEvents } from "./lms-events";

type RuntimeStatus = LmsDevtoolsEvents["runtime-status"];

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0" }}>
      <span>{label}</span>
      <strong style={{ color: ok ? "#16a34a" : "#dc2626" }}>{ok ? "yes" : "no"}</strong>
    </div>
  );
}

/** Product panel — listens to typed LMS runtime-status events. */
export function LmsDevtoolsPanel() {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);

  useEffect(() => {
    return lmsDevtoolsEvents.on("runtime-status", (event) => {
      setStatus(event.payload);
    });
  }, []);

  if (!status) {
    return (
      <div style={{ padding: 12, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
        Waiting for runtime-status…
      </div>
    );
  }

  return (
    <div style={{ padding: 12, fontFamily: "ui-monospace, monospace", fontSize: 12, lineHeight: 1.5 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>LMS runtime</div>
      <div>path: {status.path}</div>
      <Flag label="cognito env" ok={status.cognitoConfigured} />
      <Flag label="access token present" ok={status.hasAccessToken} />
      <Flag label="API base URL" ok={status.apiBaseConfigured} />
      <div style={{ marginTop: 8, opacity: 0.7 }}>
        updated {new Date(status.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
