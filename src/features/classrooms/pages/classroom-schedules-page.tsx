import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ClassroomScheduleResponse } from '@the-fundamentals/core-openapi'
import {
  deleteClassroomScheduleMutation,
  getAllClassroomSchedulesOptions,
  getAllClassroomSchedulesQueryKey,
} from '@the-fundamentals/core-openapi/react-query'
import { EllipsisVerticalIcon, PlusIcon } from 'lucide-react'

import { useConfirmAction } from '@/components/confirm-action'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CreateScheduleDialog } from '@/features/classrooms/components/create-schedule-dialog'

const schedulesRoute = getRouteApi(
  '/dashboard/classrooms/$classroomId/schedule',
)

function ScheduleRow({
  classroomId,
  schedule,
}: {
  classroomId: string
  schedule: ClassroomScheduleResponse
}) {
  const queryClient = useQueryClient()
  const confirmAction = useConfirmAction()
  const [error, setError] = useState<string | null>(null)
  const deleteSchedule = useMutation({
    ...deleteClassroomScheduleMutation(),
    onSuccess: () => {
      setError(null)
      void queryClient.invalidateQueries({
        queryKey: getAllClassroomSchedulesQueryKey({
          path: { classroomId },
        }),
      })
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not delete this schedule. Try again.',
      )
    },
  })

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 font-mono text-sm break-all">
          {schedule.scheduleRule}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Schedule actions"
              disabled={deleteSchedule.isPending}
            >
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            <DropdownMenuItem
              variant="destructive"
              disabled={deleteSchedule.isPending}
              onSelect={() => {
                void (async () => {
                  const confirmed = await confirmAction({
                    title: 'Delete this schedule?',
                    description:
                      'This classroom will no longer follow this recurrence rule.',
                    confirmLabel: 'Delete',
                    cancelLabel: 'Cancel',
                    variant: 'destructive',
                  })
                  if (!confirmed) {
                    return
                  }
                  setError(null)
                  deleteSchedule.mutate({
                    path: {
                      classroomId,
                      scheduleId: schedule.id,
                    },
                  })
                })()
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {error ? (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}

export function ClassroomSchedulesPage() {
  const { classroomId } = schedulesRoute.useParams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const { data = [], error, isPending, isError, refetch, isFetching } =
    useQuery(
      getAllClassroomSchedulesOptions({
        path: { classroomId },
      }),
    )

  if (isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error
            ? error.message
            : 'Could not load classroom schedules.'}
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-md"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <section className="flex max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-medium tracking-tight">Schedule</h2>
          <span className="text-sm text-muted-foreground">
            {(data as any).length === 1 ? '1 schedule' : `${(data as any).length} schedules`}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Create schedule"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create schedule</TooltipContent>
        </Tooltip>
      </div>
      <Separator />
      {(data as any).length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No schedules yet.
        </p>
      ) : (
        <ul className="divide-y">
          {(data as any).map((schedule: any) => (
            <ScheduleRow
              key={schedule.id}
              classroomId={classroomId}
              schedule={schedule}
            />
          ))}
        </ul>
      )}
      <CreateScheduleDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        classroomId={classroomId}
      />
    </section>
  )
}
