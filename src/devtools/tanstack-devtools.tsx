import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { AnyRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { publishLmsRuntimeStatus } from "./lms-events";
import { LmsDevtoolsPanel } from "./lms-panel";

type AppDevtoolsProps = {
  router: AnyRouter;
};

/**
 * U8 — mount once beside the app tree.
 * Vite `@tanstack/devtools-vite` strips TanStack Devtools imports/JSX from production builds by default.
 */
export function AppDevtools({ router }: AppDevtoolsProps) {
  useEffect(() => {
    const publish = () => {
      publishLmsRuntimeStatus(router.state.location.href);
    };
    publish();
    return router.subscribe("onResolved", publish);
  }, [router]);

  return (
    <TanStackDevtools
      config={{
        // Source inspector hotkey (Vite injectSource); hold to highlight JSX sources.
        inspectHotkey: ["Shift", "Alt", "CtrlOrMeta"],
      }}
      plugins={[
        {
          name: "TanStack Query",
          render: <ReactQueryDevtoolsPanel />,
        },
        {
          name: "TanStack Router",
          render: <TanStackRouterDevtoolsPanel router={router} />,
        },
        formDevtoolsPlugin(),
        {
          name: "LMS",
          render: <LmsDevtoolsPanel />,
        },
      ]}
    />
  );
}
