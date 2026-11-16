import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classroomMembersQueryOptions } from "@/shared/api/classroom-members";
import { cn } from "@/shared/lib/cn";
import { parseMoneyDigits } from "@/shared/lib/money";
import { RequestStatus, requestFailedMessage } from "@/shared/ui/request-status";
import type { ClassroomInvoicePaymentMethod } from "@/generated/types.gen";
import { parseInvoiceLineDescription } from "../lib/invoice-line-description";
import {
  approveInvoice,
  cancelInvoice,
  completeInvoice,
  fetchInvoice,
  invoicesQueryKey,
  type InvoiceRow,
} from "../lib/payment-api";
import { formatVnd } from "../lib/vnd";

function statusBadgeClass(status: InvoiceRow["status"]): string {
  if (status === "COMPLETED") {
    return "border-transparent bg-primary text-primary-foreground";
  }
  if (status === "CANCELLED") {
    return "border-transparent bg-destructive text-white";
  }
  if (status === "APPROVED") {
    return "border-transparent bg-sky-600/15 text-sky-900 dark:bg-sky-400/20 dark:text-sky-100";
  }
  return "border-transparent bg-amber-500/20 text-amber-950 dark:bg-amber-400/20 dark:text-amber-100";
}

function groupAttendedStamps(stamps: string[]): { day: string; times: string[] }[] {
  const order: string[] = [];
  const byDay = new Map<string, string[]>();
  for (const stamp of stamps) {
    const [day, time] = stamp.split(" · ");
    if (!day || !time) continue;
    if (!byDay.has(day)) {
      byDay.set(day, []);
      order.push(day);
    }
    byDay.get(day)!.push(time);
  }
  return order.map((day) => ({ day, times: byDay.get(day)! }));
}

function InvoiceLineDescription({ description }: { description: string }) {
  const view = parseInvoiceLineDescription(description);
  if (view.kind === "plain") {
    return <p className="type-body font-medium text-foreground">{view.text}</p>;
  }

  const groups = groupAttendedStamps(view.stamps);
  return (
    <div className="flex min-w-0 flex-col gap-2.5" data-testid="invoice-line-attended">
      <p className="type-secondary font-medium text-foreground">{view.label}</p>
      <ul className="flex flex-col gap-2">
        {groups.map((group) => (
          <li className="flex min-w-0 flex-col gap-1.5" key={group.day}>
            <span className="type-secondary text-muted-foreground">{group.day}</span>
            <div className="flex flex-wrap gap-1.5">
              {group.times.map((time, index) => (
                <span
                  className="rounded-md bg-muted/70 px-2 py-0.5 type-secondary tabular-nums text-foreground"
                  key={`${group.day}-${time}-${index}`}
                >
                  {time}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type InvoiceDetailProps = {
  classroomId: string;
  invoiceId: string;
  /** Hide page back-link when shown inside a dialog. */
  embedded?: boolean;
};

export function InvoiceDetail({
  classroomId,
  invoiceId,
  embedded = false,
}: InvoiceDetailProps) {
  const invoiceQuery = useQuery({
    queryKey: [...invoicesQueryKey, classroomId, invoiceId],
    queryFn: () => fetchInvoice(classroomId, invoiceId),
  });
  const membersQuery = useQuery(classroomMembersQueryOptions(classroomId));

  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<ClassroomInvoicePaymentMethod>("BANK");

  const invoice = invoiceQuery.data;
  const studentName =
    membersQuery.data?.find((m) => m.id === invoice?.memberId)?.name ??
    invoice?.memberId ??
    "student";
  const readOnly =
    invoice?.status === "COMPLETED" || invoice?.status === "CANCELLED";
  const canCancel = invoice?.status === "DRAFT" || invoice?.status === "APPROVED";
  const label = invoice
    ? `${invoice.type} invoice for ${studentName}`
    : "this invoice";

  const lineCount = invoice?.lines.length ?? 0;
  const totalQty = useMemo(
    () => (invoice?.lines ?? []).reduce((sum, line) => sum + line.quantity, 0),
    [invoice?.lines],
  );

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
        <div className="flex flex-col gap-5" data-testid="invoice-detail">
          {embedded ? (
            <header className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-section truncate text-foreground">{studentName}</p>
                  <p className="mt-1 type-secondary text-muted-foreground">
                    {lineCount} line{lineCount === 1 ? "" : "s"}
                    {totalQty > 0 ? ` · qty ${totalQty}` : ""}
                  </p>
                </div>
                <p className="shrink-0 tabular-nums type-section tracking-tight text-foreground">
                  {formatVnd(invoice.totalAmount)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  className={cn(
                    "px-1.5 py-0 text-[0.65rem] font-semibold tracking-wide uppercase",
                    statusBadgeClass(invoice.status),
                  )}
                  data-testid="invoice-status"
                >
                  {invoice.status}
                </Badge>
                <Badge
                  className="border-border/80 bg-muted/50 px-1.5 py-0 text-[0.65rem] font-semibold tracking-wide uppercase"
                  variant="outline"
                >
                  {invoice.type}
                </Badge>
              </div>
            </header>
          ) : (
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
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="type-section text-foreground">{studentName}</p>
                  <Badge
                    className={cn(
                      "px-1.5 py-0 text-[0.65rem] font-semibold tracking-wide uppercase",
                      statusBadgeClass(invoice.status),
                    )}
                    data-testid="invoice-status"
                  >
                    {invoice.status}
                  </Badge>
                  <Badge
                    className="border-border/80 bg-muted/50 px-1.5 py-0 text-[0.65rem] font-semibold tracking-wide uppercase"
                    variant="outline"
                  >
                    {invoice.type}
                  </Badge>
                </div>
                <p className="tabular-nums type-body font-medium text-foreground">
                  {formatVnd(invoice.totalAmount)}
                </p>
              </div>
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-border shadow-sm ring-1 ring-primary/5">
            <div className="border-b border-border/70 bg-muted/25 px-4 py-2">
              <p className="type-secondary font-medium text-muted-foreground">Lines</p>
            </div>
            <ul className="divide-y divide-border">
              {invoice.lines.map((line) => (
                <li className="flex items-start gap-4 px-4 py-3.5" key={line.id}>
                  <div className="min-w-0 flex-1">
                    <InvoiceLineDescription description={line.description} />
                    <p className="mt-2 type-secondary text-muted-foreground">
                      <span className="font-medium tracking-wide uppercase">
                        {line.kind}
                      </span>
                      <span aria-hidden className="mx-1.5 text-muted-foreground/40">
                        ·
                      </span>
                      qty {line.quantity}
                      <span aria-hidden className="mx-1.5 text-muted-foreground/40">
                        ·
                      </span>
                      {formatVnd(line.unitPrice)} each
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 tabular-nums type-body font-medium text-foreground">
                    {formatVnd(line.finalAmount)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3">
              <span className="type-secondary text-muted-foreground">Total</span>
              <span className="tabular-nums type-body font-semibold text-foreground">
                {formatVnd(invoice.totalAmount)}
              </span>
            </div>
          </section>

          {!readOnly ? (
            <div className="flex flex-col gap-3" data-testid="invoice-actions">
              {invoice.status === "APPROVED" ? (
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/15 p-4">
                  <p className="type-secondary font-medium text-foreground">Mark paid</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex min-w-32 flex-1 flex-col gap-1.5">
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
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                {invoice.status === "DRAFT" ? (
                  <Button
                    className="flex-1 sm:flex-none sm:min-w-36"
                    data-testid="invoice-approve"
                    disabled={busy}
                    onClick={() => void run(() => approveInvoice(classroomId, invoiceId))}
                    type="button"
                  >
                    Approve
                  </Button>
                ) : null}

                {invoice.status === "APPROVED" ? (
                  <Button
                    className="flex-1 sm:flex-none sm:min-w-36"
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
                ) : null}

                {canCancel ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label="More invoice actions"
                        data-testid="invoice-more"
                        disabled={busy}
                        size="icon"
                        type="button"
                        variant="outline"
                      >
                        <MoreHorizontal aria-hidden className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        data-testid="invoice-cancel"
                        disabled={busy}
                        onSelect={() => setCancelOpen(true)}
                        variant="destructive"
                      >
                        Cancel invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
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

          <AlertDialog onOpenChange={setCancelOpen} open={cancelOpen}>
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
                  onClick={() => void run(() => cancelInvoice(classroomId, invoiceId))}
                >
                  Cancel invoice
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </RequestStatus>
  );
}
