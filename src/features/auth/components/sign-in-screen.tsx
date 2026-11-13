import { CircleAlert, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AuthShell } from "./auth-shell";

type SignInScreenProps = {
  notice?: "unsaved";
  onSignIn: () => void;
  token?: string;
};

export function SignInScreen({ notice, onSignIn, token }: SignInScreenProps) {
  void token;
  return (
    <AuthShell
      description="Sign in to manage classes, sessions, and the people who join them."
      title="Sign in"
    >
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm ring-1 ring-primary/5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"
          >
            <LogIn className="size-4" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="type-section text-card-foreground">Welcome back</p>
            <p className="type-secondary text-muted-foreground">
              Continue with your school account to open the classroom console.
            </p>
          </div>
        </div>

        {notice === "unsaved" ? (
          <Alert>
            <CircleAlert aria-hidden />
            <AlertDescription>The entries on the previous form were not saved.</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="h-10 w-full transition-transform duration-200 hover:-translate-y-px"
          data-testid="sign-in"
          onClick={onSignIn}
          size="lg"
          type="button"
        >
          <LogIn aria-hidden />
          Sign in
        </Button>
      </div>
    </AuthShell>
  );
}
