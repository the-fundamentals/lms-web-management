import { afterEach, describe, expect, it, vi } from "vitest";
import type { AccountProfileResponse } from "@/generated/types.gen";
import { shellUserFromAccountProfile } from "./shell-user";

function profile(
  partial: Partial<AccountProfileResponse> &
    Pick<AccountProfileResponse, "email" | "firstName" | "lastName" | "avatarKey">,
): AccountProfileResponse {
  return {
    cognitoSub: "sub",
    createdDate: "2026-11-11T00:00:00.000Z",
    id: "p1",
    lastModifiedDate: "2026-11-11T00:00:00.000Z",
    ...partial,
  };
}

describe("shellUserFromAccountProfile", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("joins first and last name with email", () => {
    expect(
      shellUserFromAccountProfile(
        profile({
          avatarKey: "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          email: "ada@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
        }),
      ),
    ).toEqual({
      avatarUrl:
        "http://localhost:4566/lms-local-public/public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      email: "ada@example.com",
      name: "Ada Lovelace",
    });
  });

  it("builds avatarUrl from VITE_PUBLIC_ASSET_BASE_URL when set", () => {
    vi.stubEnv("VITE_PUBLIC_ASSET_BASE_URL", "https://cdn.example");
    expect(
      shellUserFromAccountProfile(
        profile({
          avatarKey: "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          email: "ada@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
        }),
      ),
    ).toEqual({
      avatarUrl: "https://cdn.example/public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      email: "ada@example.com",
      name: "Ada Lovelace",
    });
  });

  it("falls back to email when names are blank", () => {
    expect(
      shellUserFromAccountProfile(
        profile({
          avatarKey: "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          email: "only@example.com",
          firstName: " ",
          lastName: "",
        }),
      ),
    ).toEqual({
      avatarUrl:
        "http://localhost:4566/lms-local-public/public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      email: "only@example.com",
      name: "only@example.com",
    });
  });
});
