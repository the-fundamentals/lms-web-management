export type HeaderCrumb = {
  label: string;
  /** Omit for the current page crumb. */
  to?: "/classrooms" | "/";
};

export type HeaderTrail = {
  crumbs: HeaderCrumb[];
  /** Show New classroom in the header actions. */
  showNewClassroom: boolean;
};

/**
 * Route-aware header trail — breadcrumbs + whether a create CTA belongs here.
 * `pageLabel` overrides the leaf crumb (e.g. classroom name on detail).
 */
export function headerTrailForPath(pathname: string, pageLabel?: string): HeaderTrail {
  if (pathname === "/") {
    return {
      crumbs: [{ label: pageLabel ?? "Overview" }],
      showNewClassroom: true,
    };
  }

  if (pathname === "/classrooms" || pathname === "/classrooms/") {
    return {
      crumbs: [
        { label: "Management", to: "/" },
        { label: pageLabel ?? "Classrooms" },
      ],
      showNewClassroom: true,
    };
  }

  if (pathname === "/classrooms/new") {
    return {
      crumbs: [
        { label: "Management", to: "/" },
        { label: "Classrooms", to: "/classrooms" },
        { label: pageLabel ?? "New classroom" },
      ],
      showNewClassroom: false,
    };
  }

  if (pathname.startsWith("/classrooms/")) {
    return {
      crumbs: [
        { label: "Management", to: "/" },
        { label: "Classrooms", to: "/classrooms" },
        { label: pageLabel ?? "Classroom" },
      ],
      showNewClassroom: false,
    };
  }

  return {
    crumbs: [{ label: pageLabel ?? "Management" }],
    showNewClassroom: false,
  };
}
