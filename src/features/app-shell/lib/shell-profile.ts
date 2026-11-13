import "@/shared/api/client";
import { getMyAccountProfile } from "@/generated/sdk.gen";
import type { AccountProfileResponse } from "@/generated/types.gen";
import { shellUserFromAccountProfile } from "./shell-user";
import type { AppShellUser } from "../components/nav-user";

export const shellProfileQueryKey = ["account-profile", "me"] as const;

function readProfile(result: unknown): AccountProfileResponse | undefined {
  if (typeof result !== "object" || result === null || !("data" in result)) return undefined;
  const data = (result as { data?: AccountProfileResponse }).data;
  if (!data || typeof data.email !== "string") return undefined;
  return data;
}

export async function fetchShellUser(): Promise<AppShellUser> {
  const result = await getMyAccountProfile({ throwOnError: true });
  const profile = readProfile(result);
  if (!profile) throw new Error("The profile could not be loaded.");
  return shellUserFromAccountProfile(profile);
}

export function shellProfileQueryOptions() {
  return {
    queryKey: shellProfileQueryKey,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      getMyAccountProfile({ signal, throwOnError: true }).then((result) => {
        const profile = readProfile(result);
        if (!profile) throw new Error("The profile could not be loaded.");
        return shellUserFromAccountProfile(profile);
      }),
  };
}
