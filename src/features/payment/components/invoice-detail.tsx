import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseMoneyDigits } from "@/shared/lib/money";
import { RequestStatus, requestFailedMessage } from "@/shared/ui/request-status";
import type { ClassroomInvoicePaymentMethod } from "@/generated/types.gen";
import {
  approveInvoice,
  cancelInvoice,
  completeInvoice,
  fetchInvoice,
  invoicesQueryKey,
  listActiveStudents,
} from "../lib/payment-api";
import { formatVnd } from "../lib/vnd";

type InvoiceDetailProps = {
  classroomId: string;
  invoiceId: string;
};

export function InvoiceDetail({ classroomId, invoiceId }: InvoiceDetailProps) {
  const invoiceQuery = useQuery({
    queryKey: [...invoicesQueryKey, classroomId, invoiceId],
    queryFn: () => fetchInvoice(classroomId, invoiceId),
  });
  const studentsQuery = useQuery({
    queryKey: ["classroom-money-students", classroomId],
    queryFn: () => listActiveStudents(classroomId),
  });

  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<ClassroomInvoicePaymentMethod>("BANK");

  const invoice = invoiceQuery.data;
  const studentName =
    studentsQuery.data?.find((s) => s.id === invoice?.memberId)?.name ??
    invoice?.memberId ??
    "student";
  const readOnly =
    invoice?.status === "COMPLETED" || invoice?.status === "CANCELLED";
  const label = invoice
    ? `${invoice.type} invoice for ${studentName}`
    : "this invoice";

  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await action();
      await invoiceQuery.refetch();
    } catch (error) {
      setFailure(error);
    } finally {
      setBusy(false);
    }
  }

  const pending = invoiceQuery.isPending;
  const failed = invoiceQuery.isError;

  return (
    <RequestStatus
      error={invoiceQuery.error}
      onRetry={() => {
        void invoiceQuery.refetch();
      }}
      status={pending ? "pending" : failed ? "error" : "success"}
    >
      {invoice ? (
        <div className="flex flex-col gap-6" data-testid="invoice-detail">
          <div className="flex items-start gap-3">
            <Button asChild size="icon" variant="ghost">
              <Link
                params={{ classroomId }}
                to="/classrooms/$classroomId/money/invoices"
              >
                <ArrowLeft aria-hidden className="size-4" />
                <span className="sr-only">Back to Invoices</span>
              </Link>
            </Button>
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="type-section text-foreground">Invoice</p>
                <Badge data-testid="invoice-status">{invoice.status}</Badge>
                <Badge variant="outline">{invoice.type}</Badge>
              </div>
              <p className="type-secondary text-muted-foreground">
                {studentName} · {formatVnd(invoice.totalAmount)}
              </p>
            </div>
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border">
            {invoice.lines.map((line) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                key={line.id}
              >
                <div>
                  <p className="font-medium text-foreground">{line.description}</p>
                  <p className="type-secondary text-muted-foreground">
                    {line.kind} · qty {line.quantity}
                  </p>
                </div>
                <span>{formatVnd(line.finalAmount)}</span>
              </li>
            ))}
          </ul>

          {!readOnly ? (
            <div className="flex flex-col gap-4" data-testid="invoice-actions">
              {invoice.status === "DRAFT" ? (
                <Button
                  data-testid="invoice-approve"
                  disabled={busy}
                  onClick={() => void run(() => approveInvoice(classroomId, invoiceId))}
                  type="button"
                >
                  Approve
                </Button>
              ) : null}

              {invoice.status === "APPROVED" ? (
                <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
                  <p className="type-section text-foreground">Mark paid</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex min-w-32 flex-col gap-1.5">
                      <Label htmlFor="paid-amount">Paid amount (VND)</Label>
                      <Input
                        data-testid="invoice-paid-amount"
                        id="paid-amount"
                        inputMode="numeric"
                        onChange={(e) => setPaidAmount(parseMoneyDigits(e.target.value))}
                        value={paidAmount || String(invoice.totalAmount)}
                      />
                    </div>
                    <div className="flex min-w-32 flex-col gap-1.5">
                      <Label htmlFor="payment-method">Method</Label>
                      <select
                        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                        data-testid="invoice-payment-method"
                        id="payment-method"
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as ClassroomInvoicePaymentMethod)
                        }
                        value={paymentMethod}
                      >
                        <option value="BANK">Bank</option>
                        <option value="CASH">Cash</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    data-testid="invoice-mark-paid"
                    disabled={busy}
                    onClick={() => {
                      const amount = Number(
                        parseMoneyDigits(paidAmount || String(invoice.totalAmount)) || "0",
                      );
                      void run(() =>
                        completeInvoice(classroomId, invoiceId, {
                          paidAmount: amount,
                          paymentMethod,
                        }),
                      );
                    }}
                    type="button"
                  >
                    Mark paid
                  </Button>
                </div>
              ) : null}

              {invoice.status === "DRAFT" || invoice.status === "APPROVED" ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      data-testid="invoice-cancel"
                      disabled={busy}
                      type="button"
                      variant="outline"
                    >
                      Cancel invoice
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel invoice?</AlertDialogTitle>
                      <AlertDialogDescription data-testid="invoice-cancel-confirm">
                        Cancel {label}? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction
                        data-testid="invoice-cancel-confirm-action"
                        onClick={() =>
                          void run(() => cancelInvoice(classroomId, invoiceId))
                        }
                      >
                        Cancel invoice
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          ) : (
            <p className="type-secondary text-muted-foreground" data-testid="invoice-readonly">
              This invoice is {invoice.status.toLowerCase()} and read-only.
            </p>
          )}

          {failure ? (
            <Alert variant="destructive">
              <AlertDescription>{requestFailedMessage(failure)}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}
    </RequestStatus>
  );
}
