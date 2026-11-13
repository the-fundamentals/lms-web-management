import type { AccountProfileResponse } from "@/generated/types.gen";
import { publicAssetUrl } from "@/shared/lib/public-asset-url";
import type { AppShellUser } from "../components/nav-user";

/** Map GET /private/profile into AppShell footer props. */
export function shellUserFromAccountProfile(profile: AccountProfileResponse): AppShellUser {
  const first = profile.firstName.trim();
  const last = profile.lastName.trim();
  const name = [first, last].filter(Boolean).join(" ") || profile.email;
  return {
    email: profile.email,
    name,
    ...(publicAssetUrl(profile.avatarKey)
      ? { avatarUrl: publicAssetUrl(profile.avatarKey) }
      : {}),
  };
}
