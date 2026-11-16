import { useCallback, useEffect, useState } from "react";
import { ErrorScreen } from "../../../shared/ui/error-screen";
import { LoadingScreen } from "../../../shared/ui/loading-screen";
import { leaveFor, markSignedOutByServer } from "../lib/session";
import { readSignedInProfile, visibleFailure, type ProfileRead } from "../lib/profile";
import { OnboardingScreen } from "./name-form";
import { SignInScreen } from "./sign-in-screen";

type Phase =
  | { kind: "pending" }
  | { kind: "failed"; error: unknown }
  | { kind: "ready"; result: ProfileRead };

// The name form is part of this feature. This gate renders it for a missing profile and does not import another feature.
export function ProfileEntry({ onSignIn = () => undefined }: { onSignIn?: () => void }) {
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

  if (phase.kind === "pending") {
    return <LoadingScreen hint="Fetching your profile" label="Almost there" />;
  }
  if (phase.kind === "failed") {
    return (
      <ErrorScreen
        message={visibleFailure(phase.error)}
        onRetry={load}
        title="Couldn't load your profile"
        variant="page"
      />
    );
  }
  return <ProfileDestination onSignIn={onSignIn} onRetry={load} result={phase.result} />;
}

function ProfileDestination({
  onRetry,
  onSignIn,
  result,
}: {
  onRetry: () => void;
  onSignIn: () => void;
  result: ProfileRead;
}) {
  const home = !("error" in result) && result.destination === "/";
  const signedOut = !("error" in result) && result.destination === "/sign-in";

  useEffect(() => {
    if (home) leaveFor("/");
    if (signedOut) markSignedOutByServer();
  }, [home, signedOut]);

  if ("error" in result) {
    return (
      <ErrorScreen
        message={result.error}
        onRetry={onRetry}
        title="Couldn't load your profile"
        variant="page"
      />
    );
  }
  if (result.destination === "/onboarding") {
    return <OnboardingScreen avatarKey={result.avatarKey} onSignIn={onSignIn} />;
  }
  if (signedOut) return <SignInScreen notice={result.notice} onSignIn={onSignIn} />;
  return <LoadingScreen hint="Opening your workspace" label="Loading" />;
}
