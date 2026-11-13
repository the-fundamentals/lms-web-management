import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken } from "../../../shared/api/token";
import {
  clearSignedInUser,
  registerOidcRemoval,
  releaseServerRejection,
  rememberSignedInUser,
  setPageLeave,
} from "../lib/session";
import { OnboardingEntry } from "./onboarding-entry";
import { ProfileEntry } from "./profile-entry";
import { SignInRoute } from "./sign-in-route";

const authStore = vi.hoisted(() => {
  type Auth = {
    error: Error | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
    signinRedirect: () => Promise<void>;
  };
  let current: Auth = {
    error: undefined,
    isAuthenticated: true,
    isLoading: false,
    signinRedirect: () => Promise.resolve(),
  };
  const listeners = new Set<() => void>();
  const publish = (next: Auth) => {
    current = next;
    listeners.forEach((listener) => listener());
  };
  return {
    get: () => current,
    rejectSession: () => {
      publish({ ...current, isAuthenticated: false });
      return Promise.resolve();
    },
    reset: () => {
      publish({
        error: undefined,
        isAuthenticated: true,
        isLoading: false,
        signinRedirect: () => Promise.resolve(),
      });
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

vi.mock("react-oidc-context", async () => {
  const React = await import("react");
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => React.useSyncExternalStore(authStore.subscribe, authStore.get, authStore.get),
  };
});

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

    signoutRedirect() {
      return Promise.resolve();
    }
  }

  return { UserManager };
});

const accessToken = "access-marker";
const idToken = "id-marker";
const uploadedAvatarKey = "public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const storedAvatarKey = "public/11111111-1111-4111-8111-111111111111";
const uploadLandingUrl = "http://api.test/upload-landing";
const downloadLandingUrl = "http://api.test/download-landing";
const assigned: string[] = [];

type Captured = {
  body: string;
  headers: Headers;
  method: string;
  url: string;
};

function errorResponse(status: number, code: string): Response {
  return new Response(
    JSON.stringify({
      code,
      message: "Request failed",
      path: "/private/profile",
      status,
      timestamp: "2026-11-11T00:00:00.000Z",
    }),
    { headers: { "Content-Type": "application/json" }, status },
  );
}

function profileResponse(avatarKey = storedAvatarKey): Response {
  return new Response(
    JSON.stringify({
      avatarKey,
      cognitoSub: "sub",
      createdDate: "2026-11-11T00:00:00.000Z",
      email: "teacher@example.com",
      firstName: "Nguyễn",
      id: "profile-1",
      lastModifiedDate: "2026-11-11T00:00:00.000Z",
      lastName: "Văn",
    }),
    { headers: { "Content-Type": "application/json" }, status: 200 },
  );
}

function stubFetch(): Captured[] {
  const calls: Captured[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const body = await request.clone().text();
    calls.push({ body, headers: request.headers, method: request.method, url: request.url });
    if (request.url.endsWith("/private/storage") && request.method === "POST") {
      return new Response(
        JSON.stringify({
          downloadUrl: downloadLandingUrl,
          objectKey: uploadedAvatarKey,
          uploadUrl: uploadLandingUrl,
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    }
    if (request.url === uploadLandingUrl && request.method === "PUT") {
      return new Response(null, { status: 200 });
    }
    if (request.url.endsWith("/private/profile") && request.method === "PUT") {
      return profileResponse(uploadedAvatarKey);
    }
    return errorResponse(404, "ACCOUNT_PROFILE_NOT_FOUND");
  });
  return calls;
}

describe("auth integration", () => {
  beforeEach(() => {
    assigned.length = 0;
    authStore.reset();
    clearSignedInUser();
    releaseServerRejection();
    registerOidcRemoval(null);
    rememberSignedInUser(accessToken, idToken);
    vi.stubEnv("VITE_API_BASE_URL", "http://api.test");
    setPageLeave((path) => {
      assigned.push(path);
    });
  });

  afterEach(() => {
    cleanup();
    clearSignedInUser();
    releaseServerRejection();
    registerOidcRemoval(null);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    setPageLeave((path) => {
      window.location.assign(path);
    });
  });

  it("a missing profile renders the name form", async () => {
    stubFetch();

    render(<ProfileEntry />);

    expect(await screen.findByTestId("first-name")).toBeTruthy();
    expect(screen.getByTestId("last-name")).toBeTruthy();
  });

  it("save sends the typed names, uploaded objectKey as avatarKey, and X-ID-Token, and neither token appears in the document", async () => {
    const calls = stubFetch();
    render(<ProfileEntry />);
    fireEvent.change(await screen.findByTestId("first-name"), { target: { value: "Nguyễn" } });
    fireEvent.change(screen.getByTestId("last-name"), { target: { value: "Văn" } });
    const file = new File(["avatar-bytes"], "me.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("avatar-file"), { target: { files: [file] } });

    await waitFor(() => {
      expect(calls.some((call) => call.url === uploadLandingUrl && call.method === "PUT")).toBe(true);
    });
    fireEvent.click(screen.getByTestId("save-name"));

    await waitFor(() => {
      expect(calls.some((call) => call.url.endsWith("/private/profile") && call.method === "PUT")).toBe(
        true,
      );
    });
    const put = calls.find((call) => call.url.endsWith("/private/profile") && call.method === "PUT");
    const header = put?.headers.get("X-ID-Token") ?? "";
    const text = document.body.textContent ?? "";
    expect(put?.body.includes("Nguyễn")).toBe(true);
    expect(put?.body.includes("Văn")).toBe(true);
    expect(put?.body.includes(uploadedAvatarKey)).toBe(true);
    expect(calls.some((call) => call.url.includes("/test/storage/confirm-public"))).toBe(false);
    expect(header === idToken).toBe(true);
    expect(text.includes(accessToken)).toBe(false);
    expect(text.includes(idToken)).toBe(false);
    expect(put?.url.includes(accessToken)).toBe(false);
    expect(put?.url.includes(idToken)).toBe(false);
    expect(assigned).toContain("/");
  });

  it("a profile that exists leaves for /", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(profileResponse(storedAvatarKey)));

    render(<ProfileEntry />);

    await waitFor(() => {
      expect(assigned).toContain("/");
    });
    expect(screen.queryByTestId("first-name")).toBeNull();
  });

  it("onboarding sends the stored avatar key when the profile already has one", async () => {
    const calls: Captured[] = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(input, init);
      const body = await request.clone().text();
      calls.push({ body, headers: request.headers, method: request.method, url: request.url });
      return profileResponse(storedAvatarKey);
    });

    render(<OnboardingEntry />);
    fireEvent.change(await screen.findByTestId("first-name"), { target: { value: "An" } });
    fireEvent.change(screen.getByTestId("last-name"), { target: { value: "B" } });
    fireEvent.click(screen.getByTestId("save-name"));

    await waitFor(() => {
      expect(calls.some((call) => call.method === "PUT")).toBe(true);
    });
    const put = calls.find((call) => call.method === "PUT");
    expect(put?.body.includes(storedAvatarKey)).toBe(true);
    expect(put?.body.includes(uploadedAvatarKey)).toBe(false);
  });

  it("a 401 on the profile read keeps the unsaved sentence after the session is rejected", async () => {
    const removed = vi.fn(() => authStore.rejectSession());
    registerOidcRemoval(removed);
    vi.stubGlobal("fetch", () => Promise.resolve(errorResponse(401, "UNAUTHORIZED")));

    render(<SignInRoute />);

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeTruthy();
    await waitFor(() => {
      expect(authStore.get().isAuthenticated).toBe(false);
      expect(getAccessToken()).toBe("");
    });
    expect(screen.getByText("The entries on the previous form were not saved.")).toBeTruthy();
    expect(removed).toHaveBeenCalled();
  });
});
