import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type {
  ClassroomMemberPaymentPlanResponse,
  ClassroomMemberResponse,
} from '@the-fundamentals/core-openapi'
import {
  deleteClassroomMemberPaymentPlanMutation,
  getAllClassroomMembersOptions,
  getAllClassroomPaymentPlansOptions,
  getAllClassroomPaymentPlansQueryKey,
} from '@the-fundamentals/core-openapi/react-query'
import { EllipsisVerticalIcon } from 'lucide-react'

import { useConfirmAction } from '@/components/confirm-action'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { SetPaymentPlanDialog } from '@/features/classrooms/components/set-payment-plan-dialog'
import { parseSessionDate } from '@/features/classrooms/session-date'
import { cn } from '@/lib/utils'

const financesRoute = getRouteApi(
  '/dashboard/classrooms/$classroomId/finances',
)

const UNDO_WINDOW_MS = 5 * 60 * 1000

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

function canUndoPlan(createdDate: string): boolean {
  const created = new Date(createdDate).getTime()
  if (Number.isNaN(created)) {
    return false
  }
  return Date.now() - created < UNDO_WINDOW_MS
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback
}

type FinancesSubtab = 'breakdown' | 'plans'

/** Placeholder session earnings. No classroom session-revenue API yet. */
const MOCK_MONTH_SESSIONS = [
  {
    id: 'mock-1',
    name: 'Week 1 · Foundations',
    sessionDate: '2026-08-04T18:00:00',
    attended: 4,
    amount: 1_200_000,
  },
  {
    id: 'mock-2',
    name: 'Week 2 · Listening lab',
    sessionDate: '2026-08-11T18:00:00',
    attended: 5,
    amount: 1_500_000,
  },
  {
    id: 'mock-3',
    name: 'Week 3 · Speaking clinic',
    sessionDate: '2026-08-18T18:00:00',
    attended: 3,
    amount: 900_000,
  },
  {
    id: 'mock-4',
    name: 'Week 4 · Review',
    sessionDate: '2026-08-25T18:00:00',
    attended: 5,
    amount: 1_500_000,
  },
]

const MOCK_MONTH_TOTAL = MOCK_MONTH_SESSIONS.reduce(
  (sum, session) => sum + session.amount,
  0,
)

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function subtabClass(active: boolean): string {
  return cn(
    '-mb-px border-b-2 px-1 pb-2.5 text-sm transition-colors',
    active
      ? 'border-foreground font-medium text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  )
}

type StudentRateRow = {
  member: ClassroomMemberResponse
  plan: ClassroomMemberPaymentPlanResponse | undefined
}

function MockSessionEarningRow({
  session,
}: {
  session: (typeof MOCK_MONTH_SESSIONS)[number]
}) {
  const date = parseSessionDate(session.sessionDate)
  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
  }).format(date)
  const dayNumber = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
  }).format(date)
  const monthYear = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(date)

  return (
    <li className="flex gap-4 py-4">
      <div className="flex w-14 shrink-0 flex-col items-center">
        <span className="text-[10px] font-medium tracking-[0.16em] text-[var(--sidebar-tint)] uppercase">
          {weekday}
        </span>
        <span className="font-heading mt-0.5 text-2xl leading-none font-medium tracking-tight tabular-nums">
          {dayNumber}
        </span>
        <span className="mt-1 text-[10px] text-muted-foreground">
          {monthYear}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{session.name}</p>
          <p className="text-xs text-muted-foreground">
            {session.attended === 1
              ? '1 student attended'
              : `${session.attended} students attended`}
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium tabular-nums">
          {vnd.format(session.amount)}
        </p>
      </div>
    </li>
  )
}

function StudentPlanRow({
  classroomId,
  row,
  onSetPlan,
  onDeleteError,
}: {
  classroomId: string
  row: StudentRateRow
  onSetPlan: (member: ClassroomMemberResponse) => void
  onDeleteError: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const confirmAction = useConfirmAction()
  const deletePlan = useMutation(deleteClassroomMemberPaymentPlanMutation())
  const { member, plan } = row
  const undoable = plan !== undefined && canUndoPlan(plan.createdDate)

  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar>
        <AvatarFallback>{initialsFromName(member.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {plan ? 'Per session' : 'No plan'}
        </p>
      </div>
      {plan ? (
        <p className="shrink-0 text-sm font-medium tabular-nums">
          {vnd.format(plan.amount)}
        </p>
      ) : (
        <p className="shrink-0 text-sm text-muted-foreground">No plan</p>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${member.name}`}
            disabled={deletePlan.isPending}
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem
            onSelect={() => {
              onSetPlan(member)
            }}
          >
            {plan ? 'Change plan' : 'Set plan'}
          </DropdownMenuItem>
          {undoable && plan ? (
            <DropdownMenuItem
              variant="destructive"
              disabled={deletePlan.isPending}
              onSelect={() => {
                void (async () => {
                  const confirmed = await confirmAction({
                    title: 'Undo this payment plan?',
                    description:
                      'You can only undo a plan within five minutes of creating it. This does not restore a previous plan.',
                    confirmLabel: 'Undo',
                    cancelLabel: 'Cancel',
                    variant: 'destructive',
                  })
                  if (!confirmed) {
                    return
                  }
                  onDeleteError('')
                  deletePlan.mutate(
                    {
                      path: {
                        classroomId,
                        memberId: member.id,
                        paymentPlanId: plan.id,
                      },
                    },
                    {
                      onSuccess: () => {
                        void queryClient.invalidateQueries({
                          queryKey: getAllClassroomPaymentPlansQueryKey({
                            path: { classroomId },
                          }),
                        })
                      },
                      onError: (cause) => {
                        onDeleteError(
                          errorMessage(
                            cause,
                            'Could not undo this plan. It may be outside the five-minute window.',
                          ),
                        )
                      },
                    },
                  )
                })()
              }}
            >
              Undo plan
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

export function ClassroomFinancesPage() {
  const { classroomId } = financesRoute.useParams()
  const [subtab, setSubtab] = useState<FinancesSubtab>('breakdown')
  const [planMember, setPlanMember] = useState<ClassroomMemberResponse | null>(
    null,
  )
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const membersQuery = useQuery(
    getAllClassroomMembersOptions({
      path: { classroomId },
    }),
  )
  const plansQuery = useQuery(
    getAllClassroomPaymentPlansOptions({
      path: { classroomId },
    }),
  )

  const students = useMemo(
    () =>
      (membersQuery.data ?? [])
        .filter(
          (member) => member.status === 'ACTIVE' && member.role === 'STUDENT',
        )
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [membersQuery.data],
  )

  const planByMemberId = useMemo(() => {
    const map = new Map<string, ClassroomMemberPaymentPlanResponse>()
    for (const plan of plansQuery.data ?? []) {
      map.set(plan.classroomMemberId, plan)
    }
    return map
  }, [plansQuery.data])

  const rows = useMemo(
    (): StudentRateRow[] =>
      students.map((member) => ({
        member,
        plan: planByMemberId.get(member.id),
      })),
    [planByMemberId, students],
  )

  const total = useMemo(
    () =>
      rows.reduce((sum, row) => sum + (row.plan?.amount ?? 0), 0),
    [rows],
  )
  const onAPlan = rows.filter((row) => row.plan).length
  const currentPlanMember = planMember
    ? rows.find((row) => row.member.id === planMember.id)
    : undefined

  const isPending = membersQuery.isPending || plansQuery.isPending
  const isError = membersQuery.isError || plansQuery.isError
  const error = membersQuery.error ?? plansQuery.error
  const isFetching = membersQuery.isFetching || plansQuery.isFetching
  const thisMonth = monthLabel(new Date())

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <section className="rounded-xl border border-border px-4 py-5">
        <p className="text-[10px] font-medium tracking-[0.16em] text-[var(--sidebar-tint)] uppercase">
          Revenue this month
        </p>
        <p className="font-heading mt-1 text-4xl font-medium tracking-tight tabular-nums">
          {vnd.format(MOCK_MONTH_TOTAL)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {thisMonth} · {MOCK_MONTH_SESSIONS.length} sessions
        </p>
      </section>

      <div>
        <nav className="flex gap-4 border-b" aria-label="Finances sections">
          <button
            type="button"
            className={subtabClass(subtab === 'breakdown')}
            onClick={() => setSubtab('breakdown')}
          >
            Monthly revenue breakdown
          </button>
          <button
            type="button"
            className={subtabClass(subtab === 'plans')}
            onClick={() => setSubtab('plans')}
          >
            Payment plans
          </button>
        </nav>

        {subtab === 'breakdown' ? (
          <section className="flex flex-col gap-3 pt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-medium tracking-tight">Sessions</h2>
              <span className="text-sm text-muted-foreground">
                From attendance
              </span>
            </div>
            <Separator />
            <ul className="divide-y">
              {MOCK_MONTH_SESSIONS.map((session) => (
                <MockSessionEarningRow key={session.id} session={session} />
              ))}
            </ul>
          </section>
        ) : isPending ? (
          <div className="flex flex-col gap-6 pt-6">
            <Skeleton className="h-20 w-56" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 pt-6">
            <p className="text-sm text-destructive" role="alert">
              {error instanceof Error
                ? error.message
                : 'Could not load classroom finances.'}
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
        ) : (
          <>
            <section className="pt-6">
              <p className="text-[10px] font-medium tracking-[0.16em] text-[var(--sidebar-tint)] uppercase">
                Current rates
              </p>
              <p className="font-heading mt-1 text-4xl font-medium tracking-tight tabular-nums">
                {vnd.format(total)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {students.length === 0
                  ? 'No students yet.'
                  : `${onAPlan} of ${students.length === 1 ? '1 student' : `${students.length} students`} on a plan`}
              </p>
            </section>

            <section className="mt-8 flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-medium tracking-tight">Students</h2>
                <span className="text-sm text-muted-foreground">
                  Per session
                </span>
              </div>
              <Separator />
              {deleteError ? (
                <p className="text-sm text-destructive" role="alert">
                  {deleteError}
                </p>
              ) : null}
              {rows.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No students yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {rows.map((row) => (
                    <StudentPlanRow
                      key={row.member.id}
                      classroomId={classroomId}
                      row={row}
                      onSetPlan={(member) => {
                        setDeleteError(null)
                        setPlanMember(member)
                      }}
                      onDeleteError={(message) => {
                        setDeleteError(message || null)
                      }}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      <SetPaymentPlanDialog
        open={planMember !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPlanMember(null)
          }
        }}
        classroomId={classroomId}
        member={planMember}
        currentAmount={currentPlanMember?.plan?.amount}
      />
    </div>
  )
}
