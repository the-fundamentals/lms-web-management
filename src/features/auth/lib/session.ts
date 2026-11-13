import { createElement, useEffect, type ReactNode } from "react";
import { AuthProvider, useAuth } from "react-oidc-context";
import { clearAccessToken, getAccessToken, setAccessToken } from "../../../shared/api/token";

declare global {
  interface ImportMetaEnv {
    readonly VITE_COGNITO_AUTHORITY?: string;
    readonly VITE_COGNITO_CLIENT_ID?: string;
  }
}

// Id token stays in this module. The shared store is the access token only, because that bearer is sent on every later call.
let idToken = "";

const MISSING_COGNITO_ENV = "Cognito sign-in is missing its authority or client id.";

export type CognitoEnv = {
  authority: string;
  clientId: string;
};

type EndOidcSession = (redirectUrl: string) => Promise<void>;

let endOidcSession: EndOidcSession | null = null;
let removeOidcUser: (() => Promise<void>) | null = null;
let signedOutByServer = false;
// Survives releaseServerRejection. That call drops the bearer latch once the local user is gone, and the sign-in screen re-renders after isAuthenticated becomes false.
let unsavedEntries = false;

export function registerOidcSignOut(end: EndOidcSession | null): void {
  endOidcSession = end;
}

export function endOidcSessionAt(redirectUrl: string): Promise<void> {
  if (!endOidcSession) return Promise.resolve();
  return endOidcSession(redirectUrl);
}

export function rememberSignedInUser(accessToken: string, nextIdToken: string): void {
  unsavedEntries = false;
  setAccessToken(accessToken);
  idToken = nextIdToken;
}

export function clearSignedInUser(): void {
  clearAccessToken();
  idToken = "";
}

export function readIdToken(): string {
  return idToken;
}

export function registerOidcRemoval(remove: (() => Promise<void>) | null): void {
  removeOidcUser = remove;
}

export function markSignedOutByServer(): void {
  signedOutByServer = true;
  unsavedEntries = true;
  clearSignedInUser();
  void removeOidcUser?.();
}

export function entriesWereUnsaved(): boolean {
  return unsavedEntries;
}

export function serverRejectedSession(): boolean {
  return signedOutByServer;
}

export function releaseServerRejection(): void {
  signedOutByServer = false;
}

export function bearerAction(input: { accessToken: string; loading: boolean }): "remember" | "clear" | "hold" {
  if (signedOutByServer) return "clear";
  if (input.accessToken.length > 0) return "remember";
  if (!input.loading) return "clear";
  return "hold";
}

// The app unit owns the router. This unit changes the page directly until that tree exists.
let goTo = (path: string) => {
  window.location.assign(path);
};

export function leaveFor(path: string): void {
  goTo(path);
}

export function setPageLeave(leave: (path: string) => void): void {
  goTo = leave;
}

export function redactTokens(message: string): string {
  const secrets = [getAccessToken(), idToken].filter((value) => value.length > 0);
  return secrets.reduce((text, secret) => text.split(secret).join(""), message);
}

function readEnv(name: "VITE_COGNITO_AUTHORITY" | "VITE_COGNITO_CLIENT_ID"): string {
  const value = import.meta.env[name];
  return typeof value === "string" ? value : "";
}

export function signInUrl(origin: string = window.location.origin): string {
  return `${origin}/sign-in`;
}

export function onSigninCallback(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  const query = url.searchParams.toString();
  const next = `${url.pathname}${query.length > 0 ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState({}, document.title, next);
}

export function readOidcConfig(source?: CognitoEnv) {
  const authority = source ? source.authority : readEnv("VITE_COGNITO_AUTHORITY");
  const clientId = source ? source.clientId : readEnv("VITE_COGNITO_CLIENT_ID");
  if (authority.length === 0 || clientId.length === 0) throw new Error(MISSING_COGNITO_ENV);
  // oidc-client-ts keeps PKCE on for response type code unless disablePKCE is set. This unit does not implement the protocol.
  return {
    authority,
    client_id: clientId,
    onSigninCallback,
    post_logout_redirect_uri: signInUrl(),
    redirect_uri: signInUrl(),
    response_type: "code",
    scope: "openid email profile",
  };
}

function SessionBridge() {
  const auth = useAuth();
  useEffect(() => {
    registerOidcSignOut((redirectUrl) => auth.signoutRedirect({ post_logout_redirect_uri: redirectUrl }));
    registerOidcRemoval(() => auth.removeUser());
    const accessToken = auth.user?.access_token ?? "";
    const action = bearerAction({ accessToken, loading: auth.isLoading });
    if (action === "remember") rememberSignedInUser(accessToken, auth.user?.id_token ?? "");
    if (action === "clear") {
      clearSignedInUser();
      if (serverRejectedSession()) {
        if (auth.user) void auth.removeUser();
        else releaseServerRejection();
      }
    }
    return () => {
      registerOidcSignOut(null);
      registerOidcRemoval(null);
    };
  }, [auth.isLoading, auth.removeUser, auth.signoutRedirect, auth.user]);
  return null;
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const settings = readOidcConfig();
  return createElement(AuthProvider, settings, createElement(SessionBridge), children);
}
