import { useAuth } from "react-oidc-context";
import { ErrorScreen } from "../../../shared/ui/error-screen";
import { LoadingScreen } from "../../../shared/ui/loading-screen";
import { entriesWereUnsaved, redactTokens } from "../lib/session";
import { ProfileEntry } from "./profile-entry";
import { SignInScreen } from "./sign-in-screen";

// Route files only wire the URL. This screen keeps the unsaved notice after isAuthenticated becomes false.
export function SignInRoute() {
  const auth = useAuth();
  const signIn = () => {
    void auth.signinRedirect();
  };
  if (auth.isLoading) return <LoadingScreen />;
  if (auth.error) {
    return <ErrorScreen message={redactTokens(auth.error.message)} onRetry={signIn} />;
  }
  if (!auth.isAuthenticated) {
    return <SignInScreen notice={entriesWereUnsaved() ? "unsaved" : undefined} onSignIn={signIn} />;
  }
  return <ProfileEntry onSignIn={signIn} />;
}
