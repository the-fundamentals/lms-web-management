import { createFileRoute, redirect } from "@tanstack/react-router";

/** Money tab lands on Invoices; Pricing is edit-only via gear / Settings. */
export const Route = createFileRoute("/classrooms/$classroomId/money/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/classrooms/$classroomId/money/invoices",
      params: { classroomId: params.classroomId },
    });
  },
});
