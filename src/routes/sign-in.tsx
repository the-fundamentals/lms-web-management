import { createFileRoute } from "@tanstack/react-router";
import { SignInRoute } from "@/features/auth/components/sign-in-route";

export const Route = createFileRoute("/sign-in")({
  component: SignInRoute,
});
