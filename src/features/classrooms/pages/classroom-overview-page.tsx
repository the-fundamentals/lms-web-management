import { useQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import {
  getAllClassroomMembersOptions,
  getClassroomByIdOptions,
} from '@the-fundamentals/core-openapi/react-query'
import { CalendarIcon, ReceiptIcon, UsersIcon } from 'lucide-react'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const classroomRoute = getRouteApi('/dashboard/classrooms/$classroomId/')

const TEACHER_ROLES = new Set(['ADMIN', 'TEACHER'])

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

function OverviewTile({
  title,
  description,
  icon,
  to,
  params,
  className,
}: {
  title: string
  description: string
  icon: ReactNode
  to:
    | '/dashboard/classrooms/$classroomId/people'
    | '/dashboard/classrooms/$classroomId/schedule'
    | '/dashboard/classrooms/$classroomId/billing'
  params: { classroomId: string }
  className?: string
}) {
  return (
    <Link
      to={to}
      params={params}
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50',
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}

export function ClassroomOverviewPage() {
  const { classroomId } = classroomRoute.useParams()
  const classroomQuery = useQuery(
    getClassroomByIdOptions({ path: { id: classroomId } }),
  )
  const membersQuery = useQuery(
    getAllClassroomMembersOptions({ path: { classroomId } }),
  )

  const counts = useMemo(() => {
    const active = (membersQuery.data ?? []).filter(
      (member) => member.status === 'ACTIVE',
    )
    const teachers = active.filter((member) => TEACHER_ROLES.has(member.role))
    const students = active.filter((member) => member.role === 'STUDENT')
    return {
      teachers: teachers.length,
      students: students.length,
    }
  }, [membersQuery.data])

  if (classroomQuery.isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    )
  }

  if (classroomQuery.isError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive" role="alert">
          {classroomQuery.error instanceof Error
            ? classroomQuery.error.message
            : 'Could not load classroom overview.'}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={classroomQuery.isFetching}
          onClick={() => void classroomQuery.refetch()}
        >
          Try again
        </Button>
      </div>
    )
  }

  const classroom = classroomQuery.data
  const peopleSummary = membersQuery.isPending
    ? 'Loading people…'
    : `${counts.teachers === 1 ? '1 teacher' : `${counts.teachers} teachers`}, ${
        counts.students === 1 ? '1 student' : `${counts.students} students`
      }`

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Classroom details</p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="text-sm">{classroom.status === 'ARCHIVED' ? 'Archived' : 'Active'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">People</dt>
            <dd className="text-sm">{peopleSummary}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Created</dt>
            <dd className="text-sm">{formatDate(classroom.createdDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last updated</dt>
            <dd className="text-sm">{formatDate(classroom.lastModifiedDate)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OverviewTile
          title="People"
          description="Teachers and students"
          icon={<UsersIcon className="size-4" aria-hidden />}
          to="/dashboard/classrooms/$classroomId/people"
          params={{ classroomId }}
        />
        <OverviewTile
          title="Schedule"
          description="Sessions and attendance"
          icon={<CalendarIcon className="size-4" aria-hidden />}
          to="/dashboard/classrooms/$classroomId/schedule"
          params={{ classroomId }}
        />
        <OverviewTile
          title="Billing"
          description="Plans and invoices"
          icon={<ReceiptIcon className="size-4" aria-hidden />}
          to="/dashboard/classrooms/$classroomId/billing"
          params={{ classroomId }}
        />
      </section>
    </div>
  )
}
