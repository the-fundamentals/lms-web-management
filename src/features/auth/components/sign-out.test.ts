import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken } from "../../../shared/api/token";
import { clearSignedInUser, registerOidcSignOut, rememberSignedInUser } from "../lib/session";
import { SignOutButton, signOut } from "./sign-out";

vi.mock("oidc-client-ts", () => {
  class UserManager {
    events = {
      addSilentRenewError: () => undefined,
      addUserLoaded: () => undefined,
      addUserSignedOut: () => undefined,
      addUserUnloaded: () => undefined,
      removeSilentRenewError: () => undefined,
      removeUserLoaded: () => undefined,
      removeUserSignedOut: () => undefined,
      removeUserUnloaded: () => undefined,
    };

    constructor(settings: unknown) {
      void settings;
    }

    signoutRedirect() {
      return Promise.resolve();
    }
  }

  return { UserManager };
});

const accessToken = "access-marker";
const idToken = "id-marker";

describe("sign-out", () => {
  beforeEach(() => {
    clearSignedInUser();
    registerOidcSignOut(null);
  });

  afterEach(() => {
    cleanup();
    registerOidcSignOut(null);
    clearSignedInUser();
  });

  it("clears the access token", async () => {
    rememberSignedInUser(accessToken, idToken);

    await signOut();

    expect(getAccessToken()).toBe("");
  });

  it("ends the OIDC session", async () => {
    const end = vi.fn(() => Promise.resolve());
    registerOidcSignOut(end);

    await signOut();

    expect(end).toHaveBeenCalledOnce();
  });

  it("the destination is /sign-in", async () => {
    const destination = await signOut();

    expect(destination).toBe("/sign-in");
  });

  it("the token is not in that URL", async () => {
    rememberSignedInUser(accessToken, idToken);
    let redirectUrl = "";
    registerOidcSignOut((url) => {
      redirectUrl = url;
      return Promise.resolve();
    });

    await signOut();

    expect(redirectUrl.endsWith("/sign-in")).toBe(true);
    expect(redirectUrl.includes(accessToken)).toBe(false);
    expect(redirectUrl.includes(idToken)).toBe(false);
  });

  it("the button has data-testid sign-out", () => {
    render(createElement(SignOutButton, { onSignOut: () => undefined }));

    const button = screen.getByTestId("sign-out");
    expect(button.tagName).toBe("BUTTON");
    expect(button.closest("nav")).toBeNull();
    expect(button.closest("aside")).toBeNull();
  });
});
