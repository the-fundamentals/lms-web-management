import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type {
  ClassroomInvoiceStatus,
  ClassroomInvoiceType,
} from '@the-fundamentals/core-openapi'
import { getAllClassroomMembersOptions } from '@the-fundamentals/core-openapi/react-query'
import { FileTextIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { queryClassroomInvoicesOptions } from '@/features/classrooms/classrooms-query'

const INVOICE_PAGE_SIZE = 50
const ALL_FILTER = 'all'

const STATUS_LABEL: Record<ClassroomInvoiceStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  // COMPLETED is the paid state after the CO complete flow.
  COMPLETED: 'Paid',
}

const TYPE_LABEL: Record<ClassroomInvoiceType, string> = {
  GENERATED: 'Generated',
  ADHOC: 'Ad hoc',
}

function PanelHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

/** CO amount is smallest currency unit; VND has 0 fraction digits. */
function formatVndAmount(amount: number): string {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'VND',
    })
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 0
    return formatter.format(amount / 10 ** fractionDigits)
  } catch {
    return `${amount} VND`
  }
}

function formatShortId(id: string): string {
  return id.slice(0, 8)
}

function formatPeriod(periodStart?: string): string {
  if (!periodStart) {
    return '—'
  }
  const date = new Date(`${periodStart}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return periodStart
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatPaidAt(paidAt?: string): string {
  if (!paidAt) {
    return '—'
  }
  const date = new Date(paidAt)
  if (Number.isNaN(date.getTime())) {
    return paidAt
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

function invoiceStatusBadge(status: ClassroomInvoiceStatus) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="outline">{STATUS_LABEL.DRAFT}</Badge>
    case 'APPROVED':
      return <Badge variant="secondary">{STATUS_LABEL.APPROVED}</Badge>
    case 'COMPLETED':
      return <Badge variant="secondary">{STATUS_LABEL.COMPLETED}</Badge>
  }
}

export function ClassroomInvoicesPanel({
  classroomId,
}: {
  classroomId: string
}) {
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER)
  const [typeFilter, setTypeFilter] = useState<string>(ALL_FILTER)
  const [memberFilter, setMemberFilter] = useState<string>(ALL_FILTER)

  const filterBody = useMemo(() => {
    const filters: Array<{ field: string; operator: string; value: string }> =
      []
    if (statusFilter !== ALL_FILTER) {
      filters.push({ field: 'status', operator: 'eq', value: statusFilter })
    }
    if (typeFilter !== ALL_FILTER) {
      filters.push({ field: 'type', operator: 'eq', value: typeFilter })
    }
    if (memberFilter !== ALL_FILTER) {
      filters.push({ field: 'memberId', operator: 'eq', value: memberFilter })
    }
    return {
      page: 0,
      size: INVOICE_PAGE_SIZE,
      sortBy: 'createdDate',
      sortDirection: 'DESC' as const,
      ...(filters.length > 0 ? { filters } : {}),
    }
  }, [statusFilter, typeFilter, memberFilter])

  const membersQuery = useQuery(
    getAllClassroomMembersOptions({ path: { classroomId } }),
  )
  const invoicesQuery = useQuery(
    queryClassroomInvoicesOptions({
      path: { classroomId },
      body: filterBody,
    }),
  )

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const member of membersQuery.data ?? []) {
      map.set(member.id, member.name)
    }
    return map
  }, [membersQuery.data])

  const memberOptions = useMemo(() => {
    return (membersQuery.data ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [membersQuery.data])

  const invoices = invoicesQuery.data ?? []
  const isPending = membersQuery.isPending || invoicesQuery.isPending
  const isError = membersQuery.isError || invoicesQuery.isError
  const isFetching = membersQuery.isFetching || invoicesQuery.isFetching
  const error = membersQuery.error ?? invoicesQuery.error
  const hasActiveFilters =
    statusFilter !== ALL_FILTER ||
    typeFilter !== ALL_FILTER ||
    memberFilter !== ALL_FILTER

  return (
    <div className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <PanelHeader
        icon={<FileTextIcon className="size-4" aria-hidden />}
        title="Invoices"
        description="Issued statements for this classroom."
        actions={
          <Button type="button" size="sm" disabled>
            Create invoice
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger size="sm" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
            <SelectItem value="DRAFT">{STATUS_LABEL.DRAFT}</SelectItem>
            <SelectItem value="APPROVED">{STATUS_LABEL.APPROVED}</SelectItem>
            <SelectItem value="COMPLETED">{STATUS_LABEL.COMPLETED}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger size="sm" aria-label="Filter by type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>All types</SelectItem>
            <SelectItem value="GENERATED">{TYPE_LABEL.GENERATED}</SelectItem>
            <SelectItem value="ADHOC">{TYPE_LABEL.ADHOC}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={memberFilter} onValueChange={setMemberFilter}>
          <SelectTrigger size="sm" aria-label="Filter by member">
            <SelectValue placeholder="Member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER}>All members</SelectItem>
            {memberOptions.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error
              ? error.message
              : 'Could not load invoices.'}
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            disabled={isFetching}
            onClick={() => {
              void membersQuery.refetch()
              void invoicesQuery.refetch()
            }}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {!isPending && !isError && invoices.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border px-4 py-8">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'No invoices match these filters.'
              : 'No invoices for this classroom yet.'}
          </p>
        </div>
      ) : null}

      {!isPending && !isError && invoices.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Invoice</th>
                <th className="px-4 py-2.5 font-medium">Member</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Period</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Paid</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-2.5">
                    <span
                      className="font-mono text-xs font-medium tabular-nums"
                      title={invoice.id}
                    >
                      {formatShortId(invoice.id)}
                    </span>
                  </td>
                  <td className="max-w-40 truncate px-4 py-2.5 font-medium">
                    {memberNameById.get(invoice.memberId) ?? 'Unknown member'}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {TYPE_LABEL[invoice.type]}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {formatPeriod(invoice.periodStart)}
                  </td>
                  <td className="px-4 py-2.5">
                    {invoiceStatusBadge(invoice.status)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                    {formatVndAmount(invoice.totalAmount)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {formatPaidAt(invoice.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
