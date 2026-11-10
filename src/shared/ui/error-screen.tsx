import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ErrorScreenProps = {
  message: string;
  onRetry: () => void;
};

// Import paths are shadcn's src/components/ui. This screen does not resolve in the app until u0-design-system exists.
export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="bg-background text-foreground" data-testid="error-screen">
      <Alert className="text-destructive">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button data-testid="error-screen-retry-button" onClick={onRetry} type="button">
        Try again
      </Button>
    </div>
  );
}
