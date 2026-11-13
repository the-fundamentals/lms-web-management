import { createFileRoute } from "@tanstack/react-router";
import { OnboardingEntry } from "@/features/auth/components/onboarding-entry";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingEntry,
});
