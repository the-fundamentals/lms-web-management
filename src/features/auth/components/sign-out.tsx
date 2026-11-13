import { Button } from "@/components/ui/button";
import { clearSignedInUser, endOidcSessionAt, signInUrl } from "../lib/session";

export async function signOut(): Promise<string> {
  clearSignedInUser();
  const destination = "/sign-in";
  await endOidcSessionAt(signInUrl());
  return destination;
}

export function SignOutButton({ onSignOut }: { onSignOut: () => void }) {
  return (
    <Button data-testid="sign-out" onClick={onSignOut} type="button">
      Sign out
    </Button>
  );
}
