export type ProfileDestination =
  | { destination: "/" }
  | { destination: "/onboarding" }
  | { destination: "/sign-in"; notice: "unsaved" }
  | { error: string };

const PROFILE_NOT_FOUND = "ACCOUNT_PROFILE_NOT_FOUND";

// Email is accepted so a caller can pass the profile through, and then ignored. This gate does not edit email and does not grant ADMIN.
export function decideProfileDestination(input: {
  code?: string;
  email?: string;
  status: number;
}): ProfileDestination {
  void input.email;
  if (input.status === 200) return { destination: "/" };
  if (input.status === 404 && input.code === PROFILE_NOT_FOUND) return { destination: "/onboarding" };
  if (input.status === 401) return { destination: "/sign-in", notice: "unsaved" };
  return { error: "The profile could not be loaded." };
}
