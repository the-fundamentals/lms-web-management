import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken } from "../../../shared/api/token";
import {
  bearerAction,
  clearSignedInUser,
  markSignedOutByServer,
  onSigninCallback,
  readOidcConfig,
  registerOidcRemoval,
  releaseServerRejection,
  rememberSignedInUser,
  signInUrl,
} from "./session";

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

    getUser() {
      return Promise.resolve(null);
    }

    signinCallback() {
      return Promise.resolve(null);
    }

    signinRedirect() {
      return Promise.resolve();
    }

    signoutRedirect() {
      return Promise.resolve();
    }
  }

  return { UserManager };
});

const accessToken = "access-marker";
const idToken = "id-marker";

describe("session", () => {
  beforeEach(() => {
    clearSignedInUser();
    releaseServerRejection();
    registerOidcRemoval(null);
    window.history.replaceState({}, "", "/sign-in");
  });

  it("set then get stores the access token in the shared bearer store", () => {
    rememberSignedInUser(accessToken, idToken);

    expect(getAccessToken() === accessToken).toBe(true);
  });

  it("the id token is not written into that bearer store", () => {
    rememberSignedInUser(accessToken, idToken);

    expect(getAccessToken() === idToken).toBe(false);
    expect(getAccessToken() === accessToken).toBe(true);
  });

  it("clear removes the access token", () => {
    rememberSignedInUser(accessToken, idToken);

    clearSignedInUser();

    expect(getAccessToken()).toBe("");
  });

  it("the access token is not placed in the redirect URL", () => {
    rememberSignedInUser(accessToken, idToken);
    window.history.replaceState({}, "", "/sign-in?code=abc&state=xyz");

    onSigninCallback();

    const url = signInUrl("https://app.example");
    expect(url).toBe("https://app.example/sign-in");
    expect(url.includes(accessToken)).toBe(false);
    expect(window.location.href.includes(accessToken)).toBe(false);
    expect(window.location.search.includes("code=")).toBe(false);
  });

  it("the id token is not placed in the redirect URL", () => {
    rememberSignedInUser(accessToken, idToken);
    window.history.replaceState({}, "", "/sign-in?code=abc&state=xyz");

    onSigninCallback();

    const url = signInUrl("https://app.example");
    expect(url.includes(idToken)).toBe(false);
    expect(window.location.href.includes(idToken)).toBe(false);
    expect(window.location.search.includes("state=")).toBe(false);
  });

  it("a rejected session clears the bearer and drops the local user", () => {
    rememberSignedInUser(accessToken, idToken);
    const removed = vi.fn(() => Promise.resolve());
    registerOidcRemoval(removed);

    markSignedOutByServer();

    expect(getAccessToken()).toBe("");
    expect(removed).toHaveBeenCalledOnce();
    expect(bearerAction({ accessToken, loading: false })).toBe("clear");
  });

  it("missing authority or client id is an error, and the message contains neither value", () => {
    const authority = "https://cognito.example/issuer";
    const clientId = "client-marker";
    const sources = [
      { authority: "", clientId },
      { authority, clientId: "" },
    ];

    for (const source of sources) {
      let message = "";
      try {
        readOidcConfig(source);
      } catch (error) {
        message = error instanceof Error ? error.message : "";
      }
      expect(message.length > 0).toBe(true);
      expect(message.includes(authority)).toBe(false);
      expect(message.includes(clientId)).toBe(false);
    }
  });
});
