import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequestStatus } from "@/shared/ui/request-status";
import {
  invoicesQueryKey,
  listInvoices,
  type InvoiceRow,
} from "../lib/payment-api";
import { formatVnd } from "../lib/vnd";
import { PricingSummaryCard } from "./pricing-summary-card";

type InvoiceListProps = {
  classroomId: string;
};

function statusVariant(
  status: InvoiceRow["status"],
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "COMPLETED") return "default";
  if (status === "CANCELLED") return "destructive";
  if (status === "APPROVED") return "secondary";
  return "outline";
}

/** Money home: invoices first; tiny pricing summary + gear for edits. */
export function InvoiceList({ classroomId }: InvoiceListProps) {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: [...invoicesQueryKey, classroomId],
    queryFn: () => listInvoices(classroomId),
  });

  return (
    <div className="flex flex-col gap-6" data-testid="invoice-list-page">
      <PricingSummaryCard classroomId={classroomId} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="flex flex-col gap-1">
          <h2 className="type-section text-foreground">Invoices</h2>
          <p className="type-secondary text-muted-foreground max-w-2xl">
            Draft, approve, and mark paid. Edit rates via the gear on the summary
            above.
          </p>
        </header>
        <Button asChild data-testid="new-invoice">
          <Link
            params={{ classroomId }}
            to="/classrooms/$classroomId/money/invoices/new"
          >
            New invoice
          </Link>
        </Button>
      </div>

      <RequestStatus
        error={query.error}
        onRetry={() => {
          void query.refetch();
        }}
        status={query.isPending ? "pending" : query.isError ? "error" : "success"}
      >
        <div data-testid="invoice-list-section">
          {(query.data ?? []).length === 0 ? (
            <div
              className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-6"
              data-testid="invoice-list-empty"
            >
              <p className="text-foreground">No invoices yet</p>
              <p className="type-secondary text-muted-foreground">
                Create an adhoc draft, or wait for the server monthly job.
              </p>
              <Button asChild data-testid="new-invoice-empty">
                <Link
                  params={{ classroomId }}
                  to="/classrooms/$classroomId/money/invoices/new"
                >
                  New invoice
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-0 divide-y divide-border" data-testid="invoice-list">
              {(query.data ?? []).map((invoice) => (
                <li key={invoice.id}>
                  <button
                    className="flex w-full flex-wrap items-center gap-3 px-1 py-3 text-left hover:bg-muted/40"
                    data-testid={`invoice-row-${invoice.id}`}
                    onClick={() => {
                      void navigate({
                        to: "/classrooms/$classroomId/money/invoices/$invoiceId",
                        params: { classroomId, invoiceId: invoice.id },
                      });
                    }}
                    type="button"
                  >
                    <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
                    <Badge variant="outline">{invoice.type}</Badge>
                    <span className="font-medium text-foreground">
                      {formatVnd(invoice.totalAmount)}
                    </span>
                    <span className="type-secondary text-muted-foreground">
                      {invoice.memberId.slice(0, 8)}…
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </RequestStatus>
    </div>
  );
}
