import { describe, expect, it } from "vitest";
import { decideProfileDestination } from "./profile-gate";

describe("profile gate", () => {
  it("profile 200 goes to /", () => {
    const result = decideProfileDestination({ status: 200 });

    expect("destination" in result && result.destination === "/").toBe(true);
  });

  it("HTTP 404 with code ACCOUNT_PROFILE_NOT_FOUND goes to /onboarding", () => {
    const result = decideProfileDestination({
      code: "ACCOUNT_PROFILE_NOT_FOUND",
      status: 404,
    });

    expect(result).toEqual({ destination: "/onboarding" });
  });

  it("HTTP 401 goes to /sign-in with notice unsaved", () => {
    expect(decideProfileDestination({ status: 401 })).toEqual({
      destination: "/sign-in",
      notice: "unsaved",
    });
  });

  it("a different 404 stays an error", () => {
    const result = decideProfileDestination({ code: "OTHER", status: 404 });

    expect(result).toEqual({ error: "The profile could not be loaded." });
    expect(result).not.toHaveProperty("destination");
  });

  it("email is not part of the decision", () => {
    const first = decideProfileDestination({ email: "one@example.com", status: 200 });
    const second = decideProfileDestination({ email: "two@example.com", status: 200 });

    expect(first).toEqual(second);
    expect(first).not.toHaveProperty("email");
  });

  it("the result does not grant ADMIN", () => {
    const result = decideProfileDestination({ email: "teacher@example.com", status: 200 });

    expect(result).not.toHaveProperty("role");
    expect(JSON.stringify(result).includes("ADMIN")).toBe(false);
  });
});
