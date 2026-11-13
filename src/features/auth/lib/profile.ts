import "../../../shared/api/client";
import { getMyAccountProfile, updateMyAccountProfile } from "../../../generated/sdk.gen";
import type { AccountProfileResponse } from "../../../generated/types.gen";
import { preserveTeacherText } from "../../../shared/lib/text";
import { decideProfileDestination, type ProfileDestination } from "./profile-gate";
import { readIdToken, redactTokens } from "./session";

export type ProfileRead = ProfileDestination & {
  avatarKey?: string;
};

function errorParts(error: unknown): { code?: string; status: number } {
  if (typeof error !== "object" || error === null) return { status: 0 };
  const record = error as { code?: unknown; status?: unknown };
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    status: typeof record.status === "number" ? record.status : 0,
  };
}

function readProfile(result: unknown): AccountProfileResponse | undefined {
  if (typeof result !== "object" || result === null || !("data" in result)) return undefined;
  const data = (result as { data?: AccountProfileResponse }).data;
  if (!data || typeof data.avatarKey !== "string") return undefined;
  return data;
}

export async function readSignedInProfile(): Promise<ProfileRead> {
  try {
    const result = await getMyAccountProfile();
    const profile = readProfile(result);
    if (!profile) return { error: "The profile could not be loaded." };
    const decision = decideProfileDestination({ status: 200 });
    if ("error" in decision || decision.destination !== "/") return decision;
    return { avatarKey: profile.avatarKey, destination: "/" };
  } catch (error) {
    return decideProfileDestination(errorParts(error));
  }
}

export async function saveProfileName(input: {
  avatarKey: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  // avatarKey is the landing-zone objectKey; profile update confirms into the public store.
  await updateMyAccountProfile({
    body: {
      avatarKey: input.avatarKey,
      firstName: preserveTeacherText(input.firstName),
      lastName: preserveTeacherText(input.lastName),
    },
    headers: {
      "X-ID-Token": readIdToken(),
    },
  });
}

export function httpStatus(error: unknown): number {
  return errorParts(error).status;
}

export function visibleFailure(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return redactTokens(error.message);
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return redactTokens(message);
  }
  return "The request failed";
}
