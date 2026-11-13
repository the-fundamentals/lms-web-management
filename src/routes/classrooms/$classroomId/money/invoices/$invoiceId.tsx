import { createFileRoute } from "@tanstack/react-router";
import { InvoiceDetail } from "@/features/payment/components/invoice-detail";

export const Route = createFileRoute("/classrooms/$classroomId/money/invoices/$invoiceId")({
  component: ClassroomInvoiceDetailRoute,
});

function ClassroomInvoiceDetailRoute() {
  const { classroomId, invoiceId } = Route.useParams();
  return <InvoiceDetail classroomId={classroomId} invoiceId={invoiceId} />;
}
