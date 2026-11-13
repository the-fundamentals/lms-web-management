import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...rest
  }: {
    children?: ReactNode;
    to: string;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/" } }),
}));

const user = {
  avatarUrl: "https://cdn.example/public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "ada@example.com",
  name: "Ada Lovelace",
};

function wrap(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

describe("app shell", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the sidebar chrome with brand and Overview + Classrooms", () => {
    wrap(
      <AppShell onSignOut={() => undefined} title="Overview" user={user}>
        <div>main</div>
      </AppShell>,
    );
    expect(screen.getByTestId("app-sidebar")).toBeTruthy();
    expect(screen.getByTestId("app-sidebar").textContent).toContain("The Fundamentals");
    expect(screen.getByTestId("app-sidebar").textContent).toContain("Management");
    expect(screen.getByTestId("brand-mark")).toBeTruthy();
    expect(screen.getByTestId("sidebar-overview").getAttribute("href")).toBe("/");
    expect(screen.getByTestId("sidebar-classrooms").getAttribute("href")).toBe(
      "/classrooms",
    );
  });

  it("New classroom sidebar control points at /classrooms/new", () => {
    wrap(
      <AppShell onSignOut={() => undefined} title="Overview" user={user}>
        <div>main</div>
      </AppShell>,
    );
    expect(screen.getByTestId("sidebar-new-classroom").getAttribute("href")).toBe(
      "/classrooms/new",
    );
  });

  it("header shows breadcrumbs, New classroom, and no sidebar collapse trigger", () => {
    wrap(
      <AppShell onSignOut={() => undefined} user={user}>
        <div>main</div>
      </AppShell>,
    );
    expect(screen.getByTestId("app-header-trail").textContent).toContain("Overview");
    expect(screen.getByTestId("header-new-classroom").getAttribute("href")).toBe(
      "/classrooms/new",
    );
    expect(screen.queryByTestId("sidebar-trigger")).toBeNull();
  });

  it("profile footer shows the account name, email, and avatar URL", () => {
    wrap(
      <AppShell onSignOut={() => undefined} title="Overview" user={user}>
        <div>main</div>
      </AppShell>,
    );
    expect(screen.getByTestId("nav-user-trigger").textContent).toContain("Ada Lovelace");
    expect(screen.getByTestId("nav-user-trigger").textContent).toContain("ada@example.com");
    expect(screen.getByTestId("nav-user-avatar").getAttribute("src")).toBe(user.avatarUrl);
  });

  it("Sign out has data-testid sign-out and invokes onSignOut", () => {
    const onSignOut = vi.fn();
    wrap(
      <AppShell onSignOut={onSignOut} title="Overview" user={user}>
        <div>main</div>
      </AppShell>,
    );
    fireEvent.click(screen.getByTestId("sign-out"));
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
