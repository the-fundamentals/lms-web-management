import { Fragment, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { headerTrailForPath } from "../lib/header-trail";

type AppHeaderProps = {
  /** Optional leaf crumb override (classroom name, etc.). */
  title?: string;
  /** Extra actions after the built-in New classroom CTA. */
  actions?: ReactNode;
};

/**
 * Route-aware header: breadcrumbs + contextual actions (not a duplicate page H1).
 * Page headings stay in the main content.
 */
export function AppHeader({ title, actions }: AppHeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const trail = headerTrailForPath(pathname, title);

  return (
    <header
      className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border bg-background"
      data-testid="app-header"
    >
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList data-testid="app-header-trail">
            {trail.crumbs.map((crumb, index) => {
              const isLast = index === trail.crumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  <BreadcrumbItem>
                    {isLast || !crumb.to ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.to}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {trail.showNewClassroom ? (
            <Button asChild size="sm">
              <Link data-testid="header-new-classroom" to="/classrooms/new">
                <Plus aria-hidden />
                New classroom
              </Link>
            </Button>
          ) : null}
          {actions}
        </div>
      </div>
    </header>
  );
}
