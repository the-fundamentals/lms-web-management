import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, LayoutList, MoreHorizontal, Table2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/cn";
import { classroomMembersQueryOptions } from "@/shared/api/classroom-members";
import { requestFailedMessage, RequestStatus } from "@/shared/ui/request-status";
import { SectionLoadingSkeleton } from "@/shared/ui/section-loading-skeleton";
import {
  groupInvoicesByMonth,
  invoiceRowMeta,
} from "../lib/invoice-months";
import {
  approveInvoice,
  cancelInvoice,
  invoicesQueryKey,
  listInvoices,
  type InvoiceRow,
} from "../lib/payment-api";
import { formatVnd } from "../lib/vnd";
import { InvoiceDetailSheet } from "./invoice-detail-sheet";
import { PricingSummaryCard } from "./pricing-summary-card";

type InvoiceListProps = {
  classroomId: string;
};

type InvoiceView = "list" | "table";

/** Filled status chips — outline DRAFT was too easy to miss. */
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
  // DRAFT
  return "border-transparent bg-amber-500/20 text-amber-950 dark:bg-amber-400/20 dark:text-amber-100";
}

function memberLabel(
  memberId: string,
  memberNameById: Map<string, string>,
): string {
  return memberNameById.get(memberId) ?? `${memberId.slice(0, 8)}…`;
}

function InvoiceTypeBadge({ invoice }: { invoice: InvoiceRow }) {
  const meta = invoiceRowMeta(invoice);
  if (invoice.type === "GENERATED") {
    return (
      <Badge
        className="max-w-full gap-1.5 border-border/80 bg-muted/50 px-2 py-0.5 font-normal"
        data-testid={`invoice-type-${invoice.id}`}
        variant="outline"
      >
        <span className="text-[0.65rem] font-semibold tracking-wide uppercase">
          Generated
        </span>
        {meta ? (
          <span
            className="truncate text-[0.65rem] tabular-nums text-muted-foreground"
            data-testid={`invoice-billing-${invoice.id}`}
          >
            {meta}
          </span>
        ) : null}
      </Badge>
    );
  }
  return (
    <Badge
      className="gap-1.5 border-border/80 bg-muted/50 px-2 py-0.5 font-normal"
      data-testid={`invoice-type-${invoice.id}`}
      variant="outline"
    >
      <span className="text-[0.65rem] font-semibold tracking-wide uppercase">Adhoc</span>
      {meta ? (
        <span className="text-[0.65rem] tabular-nums text-muted-foreground">{meta}</span>
      ) : null}
    </Badge>
  );
}

function statusRailClass(status: InvoiceRow["status"]): string {
  if (status === "COMPLETED") return "bg-primary";
  if (status === "CANCELLED") return "bg-destructive";
  if (status === "APPROVED") return "bg-sky-500";
  return "bg-amber-500";
}

function InvoiceListRow({
  classroomId,
  invoice,
  memberName,
  onOpen,
  onChanged,
}: {
  classroomId: string;
  invoice: InvoiceRow;
  memberName: string;
  onOpen: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const canApprove = invoice.status === "DRAFT";
  const canCancel = invoice.status === "DRAFT" || invoice.status === "APPROVED";
  const hasActions = canApprove || canCancel;
  const meta = invoiceRowMeta(invoice);
  const typeLabel = invoice.type === "GENERATED" ? "Generated" : "Adhoc";

  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await action();
      onChanged();
    } catch (error) {
      setFailure(error);
    } finally {
      setBusy(false);
    }
  }

  // Same row language as session overview: status rail + identity / money / menu.
  return (
    <li className="group relative" data-testid={`invoice-row-${invoice.id}`}>
      <div
        className={cn(
          "relative flex items-center gap-3 overflow-hidden bg-background px-3 py-3.5 pl-4 sm:gap-4 sm:px-4 sm:pl-5",
          "transition-colors group-hover:bg-muted/35",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-3 left-0 w-1 rounded-r-full",
            statusRailClass(invoice.status),
          )}
        />

        <button
          className={cn(
            "min-w-0 flex-1 rounded-md text-left",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
          data-testid={`invoice-open-${invoice.id}`}
          onClick={onOpen}
          type="button"
        >
          <span className="block truncate type-body font-medium text-foreground">
            {memberName}
          </span>
          <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "px-1.5 py-0 text-[0.65rem] font-semibold tracking-wide uppercase",
                statusBadgeClass(invoice.status),
              )}
              data-testid={`invoice-status-${invoice.id}`}
            >
              {invoice.status}
            </Badge>
            <span
              className="type-secondary text-muted-foreground"
              data-testid={`invoice-type-${invoice.id}`}
            >
              {typeLabel}
            </span>
            {meta ? (
              <>
                <span aria-hidden className="text-muted-foreground/35">
                  ·
                </span>
                <span
                  className="type-secondary tabular-nums text-muted-foreground"
                  data-testid={`invoice-billing-${invoice.id}`}
                >
                  {meta}
                </span>
              </>
            ) : null}
          </span>
          <span className="sr-only">Open invoice for {memberName}</span>
        </button>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <p className="tabular-nums type-body font-semibold tracking-tight text-foreground">
            {formatVnd(invoice.totalAmount)}
          </p>
          {hasActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`Actions for ${memberName}`}
                  className="size-8 text-muted-foreground opacity-55 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                  data-testid={`invoice-menu-${invoice.id}`}
                  disabled={busy}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <MoreHorizontal aria-hidden className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-testid={`invoice-menu-content-${invoice.id}`}>
                {canApprove ? (
                  <DropdownMenuItem
                    data-testid={`invoice-approve-${invoice.id}`}
                    disabled={busy}
                    onSelect={() => void run(() => approveInvoice(classroomId, invoice.id))}
                  >
                    <Check aria-hidden />
                    Approve
                  </DropdownMenuItem>
                ) : null}
                {canCancel ? (
                  <DropdownMenuItem
                    data-testid={`invoice-cancel-${invoice.id}`}
                    disabled={busy}
                    onSelect={() => setCancelOpen(true)}
                    variant="destructive"
                  >
                    <X aria-hidden />
                    Cancel invoice
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span aria-hidden className="size-8" />
          )}
        </div>
      </div>

      {failure ? (
        <p
          className="border-t border-border/60 bg-background px-4 py-2 type-secondary text-destructive"
          data-testid={`invoice-row-error-${invoice.id}`}
        >
          {requestFailedMessage(failure)}
        </p>
      ) : null}

      <AlertDialog onOpenChange={setCancelOpen} open={cancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel {invoice.type.toLowerCase()} invoice for {memberName}? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              data-testid={`invoice-cancel-confirm-${invoice.id}`}
              onClick={() => void run(() => cancelInvoice(classroomId, invoice.id))}
            >
              Cancel invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

function InvoiceMonthGroups({
  classroomId,
  groups,
  memberNameById,
  onOpen,
  onChanged,
}: {
  classroomId: string;
  groups: ReturnType<typeof groupInvoicesByMonth>;
  memberNameById: Map<string, string>;
  onOpen: (invoiceId: string) => void;
  onChanged: () => void;
}) {
  return (
    <div className="flex flex-col gap-6" data-testid="invoice-list" data-view="list">
      {groups.map((group) => (
        <section
          className="flex flex-col gap-2.5"
          data-testid={`invoice-month-${group.key}`}
          key={group.key}
        >
          <div className="flex items-baseline gap-2 px-0.5">
            <h3 className="type-secondary font-medium text-foreground">{group.label}</h3>
            <span className="type-secondary tabular-nums text-muted-foreground">
              {group.invoices.length}
            </span>
          </div>
          <ul className="overflow-hidden rounded-xl border border-border divide-y divide-border shadow-sm ring-1 ring-primary/5">
            {group.invoices.map((invoice) => (
              <InvoiceListRow
                classroomId={classroomId}
                invoice={invoice}
                key={invoice.id}
                memberName={memberLabel(invoice.memberId, memberNameById)}
                onChanged={onChanged}
                onOpen={() => onOpen(invoice.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function InvoiceTable({
  invoices,
  memberNameById,
  onOpen,
}: {
  invoices: InvoiceRow[];
  memberNameById: Map<string, string>;
  onOpen: (invoiceId: string) => void;
}) {
  return (
    <div
      className="overflow-x-auto rounded-xl border border-border"
      data-testid="invoice-list"
      data-view="table"
    >
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-3 py-2.5 type-secondary font-medium text-muted-foreground">
              Student
            </th>
            <th className="px-3 py-2.5 type-secondary font-medium text-muted-foreground">
              Amount
            </th>
            <th className="px-3 py-2.5 type-secondary font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-3 py-2.5 type-secondary font-medium text-muted-foreground">
              Type
            </th>
            <th className="px-3 py-2.5 type-secondary font-medium text-muted-foreground">
              Billing
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const name = memberLabel(invoice.memberId, memberNameById);
            return (
              <tr
                className="cursor-pointer border-b border-border/70 last:border-b-0 hover:bg-muted/40"
                data-testid={`invoice-row-${invoice.id}`}
                key={invoice.id}
                onClick={() => onOpen(invoice.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(invoice.id);
                  }
                }}
                role="link"
                tabIndex={0}
              >
                <td className="px-3 py-2.5 type-body font-medium text-foreground">{name}</td>
                <td className="px-3 py-2.5 type-body tabular-nums text-foreground">
                  {formatVnd(invoice.totalAmount)}
                </td>
                <td className="px-3 py-2.5">
                  <Badge
                    className={cn(
                      "px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase",
                      statusBadgeClass(invoice.status),
                    )}
                  >
                    {invoice.status}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <InvoiceTypeBadge invoice={invoice} />
                </td>
                <td className="px-3 py-2.5 type-secondary text-muted-foreground">
                  {invoiceRowMeta(invoice) || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Money home: invoices first; tiny pricing summary + gear for edits. */
export function InvoiceList({ classroomId }: InvoiceListProps) {
  const [view, setView] = useState<InvoiceView>("list");
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...invoicesQueryKey, classroomId],
    queryFn: () => listInvoices(classroomId),
  });
  // Same cache as Members tab / classroom route warm.
  const membersQuery = useQuery(classroomMembersQueryOptions(classroomId));
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of membersQuery.data ?? []) {
      map.set(member.id, member.name);
    }
    return map;
  }, [membersQuery.data]);

  const invoices = query.data ?? [];
  const monthGroups = useMemo(() => groupInvoicesByMonth(invoices), [invoices]);

  function onOpen(invoiceId: string) {
    setOpenInvoiceId(invoiceId);
  }

  return (
    <div className="flex flex-col gap-6" data-testid="invoice-list-page">
      <InvoiceDetailSheet
        classroomId={classroomId}
        invoiceId={openInvoiceId}
        onOpenChange={(open) => {
          if (!open) setOpenInvoiceId(null);
        }}
        open={Boolean(openInvoiceId)}
      />
      <PricingSummaryCard classroomId={classroomId} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <header className="flex min-w-0 flex-col gap-1">
          <h2 className="type-section text-foreground">Invoices</h2>
          <p className="type-secondary text-muted-foreground max-w-2xl">
            Draft, approve, and mark paid. Edit rates via the gear on the summary
            above.
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          <div
            aria-label="Invoices view"
            className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
            data-testid="invoices-view-selector"
            role="group"
          >
            <Button
              aria-pressed={view === "list"}
              className={cn("h-7 px-2.5", view === "list" && "bg-muted")}
              data-testid="invoices-view-list"
              onClick={() => setView("list")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <LayoutList aria-hidden />
              List
            </Button>
            <Button
              aria-pressed={view === "table"}
              className={cn("h-7 px-2.5", view === "table" && "bg-muted")}
              data-testid="invoices-view-table"
              onClick={() => setView("table")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Table2 aria-hidden />
              Table
            </Button>
          </div>
          <Button asChild data-testid="new-invoice">
            <Link
              params={{ classroomId }}
              to="/classrooms/$classroomId/money/invoices/new"
            >
              New invoice
            </Link>
          </Button>
        </div>
      </div>

      <RequestStatus
        error={query.error}
        onRetry={() => {
          void query.refetch();
        }}
        pending={<SectionLoadingSkeleton rows={5} />}
        status={query.isPending ? "pending" : query.isError ? "error" : "success"}
      >
        <div data-testid="invoice-list-section">
          {invoices.length === 0 ? (
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
          ) : view === "list" ? (
            <InvoiceMonthGroups
              classroomId={classroomId}
              groups={monthGroups}
              memberNameById={memberNameById}
              onChanged={() => {
                void query.refetch();
              }}
              onOpen={onOpen}
            />
          ) : (
            <InvoiceTable
              invoices={invoices}
              memberNameById={memberNameById}
              onOpen={onOpen}
            />
          )}
        </div>
      </RequestStatus>
    </div>
  );
}
