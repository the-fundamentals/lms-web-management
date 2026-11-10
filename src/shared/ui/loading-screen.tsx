import { Skeleton } from "@/components/ui/skeleton";

// Import path is shadcn's src/components/ui. This screen does not resolve in the app until u0-design-system exists.
export function LoadingScreen() {
  return (
    <div className="bg-background text-foreground" data-testid="loading-screen" role="status">
      <Skeleton />
      <p>Loading</p>
    </div>
  );
}
