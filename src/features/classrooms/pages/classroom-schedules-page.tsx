import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ClassroomScheduleRecurrenceResponse } from '@the-fundamentals/core-openapi'
import {
  deleteClassroomScheduleRecurrenceMutation,
  getAllClassroomScheduleRecurrencesOptions,
  getAllClassroomScheduleRecurrencesQueryKey,
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
import { Skeleton } from '@/components/ui/skeleton'
import { ClassroomScheduleCalendar } from '@/features/classrooms/components/classroom-schedule-calendar'
import { CreateScheduleDialog } from '@/features/classrooms/components/create-schedule-dialog'
import { ManageRecurrenceRulesDialog } from '@/features/classrooms/components/manage-recurrence-rules-dialog'

const schedulesRoute = getRouteApi(
  '/dashboard/classrooms/$classroomId/schedule',
)

function asScheduleList(
  data: unknown,
): Array<ClassroomScheduleRecurrenceResponse> {
  return Array.isArray(data) ? data : []
}

export function ClassroomSchedulesPage() {
  const { classroomId } = schedulesRoute.useParams()
  const queryClient = useQueryClient()
  const confirmAction = useConfirmAction()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { data, error, isError, refetch, isFetching } = useQuery(
    getAllClassroomScheduleRecurrencesOptions({
      path: { classroomId },
    }),
  )
  const schedules = asScheduleList(data)

  const deleteSchedule = useMutation({
    ...deleteClassroomScheduleRecurrenceMutation(),
    onSuccess: () => {
      setDeleteError(null)
      void queryClient.invalidateQueries({
        queryKey: getAllClassroomScheduleRecurrencesQueryKey({
          path: { classroomId },
        }),
      })
    },
    onError: (cause) => {
      setDeleteError(
        cause instanceof Error
          ? cause.message
          : 'Could not delete this schedule. Try again.',
      )
    },
  })

  async function handleDeleteSchedule(scheduleId: string) {
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
    setDeleteError(null)
    deleteSchedule.mutate({
      path: { classroomId, scheduleId },
    })
  }

  if (data === undefined && !isError) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-[36rem] w-full rounded-xl" />
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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-medium tracking-tight">Schedule</h2>
          <span className="text-sm text-muted-foreground">
            {schedules.length === 1
              ? '1 schedule'
              : `${schedules.length} schedules`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <PlusIcon />
            Add Schedule
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Schedule actions"
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem onSelect={() => setIsManageOpen(true)}>
                Manage Recurrence Rules
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {deleteError ? (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}
      <ClassroomScheduleCalendar
        classroomId={classroomId}
        schedules={schedules}
        onDeleteSchedule={(scheduleId) => {
          void handleDeleteSchedule(scheduleId)
        }}
      />
      <ManageRecurrenceRulesDialog
        open={isManageOpen}
        onOpenChange={setIsManageOpen}
        schedules={schedules}
        isDeleting={deleteSchedule.isPending}
        onAdd={() => {
          setIsManageOpen(false)
          setIsCreateOpen(true)
        }}
        onDelete={(scheduleId) => {
          void handleDeleteSchedule(scheduleId)
        }}
      />
      <CreateScheduleDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        classroomId={classroomId}
      />
    </section>
  )
}
