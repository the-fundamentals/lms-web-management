import type { ClassroomScheduleRecurrenceResponse } from '@the-fundamentals/core-openapi'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  clockLabel,
  describeRecurrence,
} from '@/features/classrooms/lib/schedule-rule'

export function ManageRecurrenceRulesDialog({
  open,
  onOpenChange,
  schedules,
  onAdd,
  onDelete,
  isDeleting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedules: readonly ClassroomScheduleRecurrenceResponse[]
  onAdd: () => void
  onDelete: (scheduleId: string) => void
  isDeleting: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage recurrence rules</DialogTitle>
          <DialogDescription>
            These rules generate the blocks on the calendar. Delete a rule or
            add a new one.
          </DialogDescription>
        </DialogHeader>
        {schedules.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No recurrence rules yet.
          </p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {describeRecurrence(schedule)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {clockLabel(schedule.startTime)} –{' '}
                    {clockLabel(schedule.endTime)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => onDelete(schedule.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button type="button" onClick={onAdd}>
            <PlusIcon />
            Add Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
