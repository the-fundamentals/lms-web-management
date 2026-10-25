import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type {
  ClassroomMemberPaymentPlanResponse,
  ClassroomMemberResponse,
  PaymentPlanType,
} from '@the-fundamentals/core-openapi'
import {
  getAllClassroomMembersOptions,
  getAllClassroomPaymentPlansOptions,
} from '@the-fundamentals/core-openapi/react-query'
import { CreditCardIcon, ReceiptIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ClassroomInvoicesPanel } from '@/features/classrooms/components/classroom-invoices-panel'
import { SetPaymentPlanDialog } from '@/features/classrooms/components/set-payment-plan-dialog'
import { cn } from '@/lib/utils'

/**
 * Classroom billing UI. Overview remains mock. Plans + Invoices load from
 * core-openapi.
 *
 * Layout: AWS console-style vertical section nav + full-width main panel.
 * Uses shadcn Tabs orientation=vertical for keyboard a11y.
 */

const billingRoute = getRouteApi('/dashboard/classrooms/$classroomId/billing')

const SECTION_NAV = [
  { value: 'overview', label: 'Overview' },
  { value: 'plans', label: 'Plans' },
  { value: 'invoices', label: 'Invoices' },
] as const

function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
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

function OverviewPanel() {
  return (
    <div className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <PanelHeader
        icon={<ReceiptIcon className="size-4" aria-hidden />}
        title="This month"
        description="Tuition collected and outstanding for this classroom."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Collected" value="$960" hint="2 invoices paid" />
        <Metric label="Outstanding" value="$360" hint="1 overdue invoice" />
        <Metric label="Active students" value="12" hint="On Standard plan" />
      </div>

      <section className="flex flex-col gap-2">
        <h4 className="text-sm font-medium">Recent activity</h4>
        <ul className="overflow-hidden rounded-lg border border-border">
          {[
            {
              id: 'a1',
              title: 'Payment received',
              detail: 'INV-1042 · Sep 2026',
              when: '3 days ago',
            },
            {
              id: 'a2',
              title: 'Invoice issued',
              detail: 'INV-1042 · 12 students',
              when: '1 week ago',
            },
            {
              id: 'a3',
              title: 'Reminder sent',
              detail: 'INV-1031 · overdue',
              when: '2 weeks ago',
            },
          ].map((item, index) => (
            <li
              key={item.id}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-2.5',
                index > 0 && 'border-t border-border',
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {item.detail}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.when}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** CO amount is smallest currency unit; convert via ISO fraction digits. */
function formatPlanAmount(amount: number, currency: string): string {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    })
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 0
    return formatter.format(amount / 10 ** fractionDigits)
  } catch {
    return `${amount} ${currency}`
  }
}

function formatPlanSummary(plan: ClassroomMemberPaymentPlanResponse): string {
  // PaymentPlanType is currently PER_SESSION-only in CO.
  const typeLabel: Record<PaymentPlanType, string> = {
    PER_SESSION: 'Per session',
  }
  return `${formatPlanAmount(plan.amount, plan.currency)} · ${typeLabel[plan.type]}`
}

function PlansPanel() {
  const { classroomId } = billingRoute.useParams()
  const [planTarget, setPlanTarget] = useState<{
    member: ClassroomMemberResponse
    hasExistingPlan: boolean
  } | null>(null)

  const membersQuery = useQuery(
    getAllClassroomMembersOptions({ path: { classroomId } }),
  )
  const plansQuery = useQuery(
    getAllClassroomPaymentPlansOptions({ path: { classroomId } }),
  )

  const students = useMemo(() => {
    return (membersQuery.data ?? [])
      .filter(
        (member) => member.status === 'ACTIVE' && member.role === 'STUDENT',
      )
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [membersQuery.data])

  const planByMemberId = useMemo(() => {
    const map = new Map<string, ClassroomMemberPaymentPlanResponse>()
    for (const plan of plansQuery.data ?? []) {
      // List is current plans only (`effectiveTo` null); keep first if duplicates.
      if (!map.has(plan.classroomMemberId)) {
        map.set(plan.classroomMemberId, plan)
      }
    }
    return map
  }, [plansQuery.data])

  const isPending = membersQuery.isPending || plansQuery.isPending
  const isError = membersQuery.isError || plansQuery.isError
  const isFetching = membersQuery.isFetching || plansQuery.isFetching
  const error = membersQuery.error ?? plansQuery.error

  return (
    <div className="flex flex-col gap-5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <PanelHeader
        icon={<CreditCardIcon className="size-4" aria-hidden />}
        title="Plans"
        description="Current tuition plan for each active student."
      />

      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : null}

      {isError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error
              ? error.message
              : 'Could not load payment plans.'}
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            disabled={isFetching}
            onClick={() => {
              void membersQuery.refetch()
              void plansQuery.refetch()
            }}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {!isPending && !isError && students.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border px-4 py-8">
          <p className="text-sm text-muted-foreground">
            No active students in this classroom yet.
          </p>
        </div>
      ) : null}

      {!isPending && !isError && students.length > 0 ? (
        <ul className="overflow-hidden rounded-lg border border-border">
          {students.map((student, index) => {
            const plan = planByMemberId.get(student.id)
            return (
              <li
                key={student.id}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-2.5',
                  index > 0 && 'border-t border-border',
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {student.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {plan ? (
                    <p className="text-sm font-medium tabular-nums">
                      {formatPlanSummary(plan)}
                    </p>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No plan
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPlanTarget({
                        member: student,
                        hasExistingPlan: Boolean(plan),
                      })
                    }}
                  >
                    {plan ? 'Set plan' : 'Add plan'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      {planTarget ? (
        <SetPaymentPlanDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setPlanTarget(null)
            }
          }}
          classroomId={classroomId}
          memberId={planTarget.member.id}
          memberName={planTarget.member.name}
          hasExistingPlan={planTarget.hasExistingPlan}
        />
      ) : null}
    </div>
  )
}

function InvoicesPanel() {
  const { classroomId } = billingRoute.useParams()
  return <ClassroomInvoicesPanel classroomId={classroomId} />
}

export function ClassroomBillingPage() {
  // Console pattern: vertical line tabs as left section nav (md+); stacks above
  // content on narrow viewports. Radix Tabs keeps arrow-key a11y either way.
  return (
    <Tabs
      defaultValue="overview"
      orientation="vertical"
      className="w-full flex-col items-stretch gap-4 md:flex-row md:items-start md:gap-0"
    >
      <TabsList
        variant="line"
        aria-label="Billing sections"
        className="w-full shrink-0 gap-0.5 rounded-none border-b border-border pb-2 md:w-44 md:border-b-0 md:border-r md:pb-0 md:pr-3"
      >
        {SECTION_NAV.map((section) => (
          <TabsTrigger
            key={section.value}
            value={section.value}
            className="h-8 justify-start px-3 text-sm"
          >
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="min-w-0 flex-1 md:pl-6">
        <TabsContent value="overview" className="mt-0">
          <OverviewPanel />
        </TabsContent>
        <TabsContent value="plans" className="mt-0">
          <PlansPanel />
        </TabsContent>
        <TabsContent value="invoices" className="mt-0">
          <InvoicesPanel />
        </TabsContent>
      </div>
    </Tabs>
  )
}
