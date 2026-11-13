import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode, useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AuthSessionProvider, setPageLeave } from "./features/auth/lib/session";
import { routeTree } from "./routeTree.gen";
import "@/shared/api/client";
import { queryClient } from "@/shared/api/query-client";
import { ErrorScreen } from "@/shared/ui/error-screen";
import "./index.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

setPageLeave((path) => {
  void router.navigate({ to: path as "/" | "/sign-in" | "/onboarding" });
});

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root is missing");
}

function cognitoEnvReady(): boolean {
  const authority = import.meta.env.VITE_COGNITO_AUTHORITY;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  return (
    typeof authority === "string" &&
    authority.length > 0 &&
    typeof clientId === "string" &&
    clientId.length > 0
  );
}

/** DEV-only dynamic import — keeps Devtools + EventClient out of the production graph. */
function DevtoolsHost() {
  const [node, setNode] = useState<ReactNode>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;
    void import("./devtools/tanstack-devtools").then(({ AppDevtools }) => {
      if (!cancelled) {
        setNode(<AppDevtools router={router} />);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return node;
}

function App() {
  if (!cognitoEnvReady()) {
    return (
      <ErrorScreen
        message="Cognito authority/client id missing — fill `.env`"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <RouterProvider router={router} />
        <DevtoolsHost />
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
