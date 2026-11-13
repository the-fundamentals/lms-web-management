import { createFileRoute } from "@tanstack/react-router";
import { InvoiceList } from "@/features/payment/components/invoice-list";

export const Route = createFileRoute("/classrooms/$classroomId/money/invoices/")({
  component: ClassroomMoneyInvoicesRoute,
});

function ClassroomMoneyInvoicesRoute() {
  const { classroomId } = Route.useParams();
  return <InvoiceList classroomId={classroomId} />;
}
