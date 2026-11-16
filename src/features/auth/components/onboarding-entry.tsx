import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { ErrorScreen } from "../../../shared/ui/error-screen";
import { LoadingScreen } from "../../../shared/ui/loading-screen";
import { readSignedInProfile, visibleFailure, type ProfileRead } from "../lib/profile";
import { markSignedOutByServer } from "../lib/session";
import { OnboardingScreen } from "./name-form";
import { SignInScreen } from "./sign-in-screen";

type Phase =
  | { kind: "pending" }
  | { kind: "failed"; error: unknown }
  | { kind: "ready"; result: ProfileRead };

// Session wiring stays in the feature. Route files only render this screen (R-06).
export function OnboardingEntry({ onSignIn }: { onSignIn?: () => void } = {}) {
  const auth = useAuth();
  const signIn = onSignIn ?? (() => {
    void auth.signinRedirect();
  });
  const [phase, setPhase] = useState<Phase>({ kind: "pending" });
  const load = useCallback(() => {
    setPhase({ kind: "pending" });
    readSignedInProfile()
      .then((result) => setPhase({ kind: "ready", result }))
      .catch((error: unknown) => setPhase({ kind: "failed", error }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signedOut = phase.kind === "ready" && !("error" in phase.result) && phase.result.destination === "/sign-in";

  useEffect(() => {
    if (signedOut) markSignedOutByServer();
  }, [signedOut]);

  if (phase.kind === "pending") {
    return <LoadingScreen hint="Fetching your profile" label="Almost there" />;
  }
  if (phase.kind === "failed") {
    return (
      <ErrorScreen
        message={visibleFailure(phase.error)}
        onRetry={load}
        title="Couldn't continue onboarding"
        variant="page"
      />
    );
  }
  if ("error" in phase.result) {
    return (
      <ErrorScreen
        message={phase.result.error}
        onRetry={load}
        title="Couldn't continue onboarding"
        variant="page"
      />
    );
  }
  if (signedOut) return <SignInScreen notice={phase.result.notice} onSignIn={signIn} />;
  return <OnboardingScreen avatarKey={phase.result.avatarKey} onSignIn={signIn} />;
}
