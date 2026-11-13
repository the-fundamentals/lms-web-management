import { createFileRoute } from "@tanstack/react-router";
import { InvoiceCreate } from "@/features/payment/components/invoice-create";

export const Route = createFileRoute("/classrooms/$classroomId/money/invoices/new")({
  component: ClassroomInvoiceNewRoute,
});

function ClassroomInvoiceNewRoute() {
  const { classroomId } = Route.useParams();
  return <InvoiceCreate classroomId={classroomId} />;
}
