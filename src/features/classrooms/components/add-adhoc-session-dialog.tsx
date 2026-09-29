import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClassroomSessionMutation } from '@the-fundamentals/core-openapi/react-query'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { invalidateClassroomSessionsQueries } from '@/features/classrooms/classrooms-query'

type FormState = {
  sessionDate: string
  startTime: string
  endTime: string
  name: string
  description: string
}

const EMPTY_FORM: FormState = {
  sessionDate: '',
  startTime: '',
  endTime: '',
  name: '',
  description: '',
}

export function AddAdhocSessionDialog({
  open,
  onOpenChange,
  classroomId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM)
      setError(null)
    }
  }, [open])

  const createSession = useMutation({
    ...createClassroomSessionMutation(),
    onSuccess: () => {
      invalidateClassroomSessionsQueries(queryClient)
      onOpenChange(false)
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create the session. Try again.',
      )
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const sessionDate = form.sessionDate.trim()
    const startTime = form.startTime.trim()
    const endTime = form.endTime.trim()
    const name = form.name.trim()
    const description = form.description.trim()

    if (!sessionDate || !startTime || !endTime) {
      setError('Date, start time, and end time are required.')
      return
    }

    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    createSession.mutate({
      path: { classroomId },
      body: {
        sessionDate,
        startTime,
        endTime,
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add adhoc session</DialogTitle>
            <DialogDescription>
              Create a one-off open session for this classroom.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adhoc-session-date">Date</Label>
              <Input
                id="adhoc-session-date"
                type="date"
                required
                disabled={createSession.isPending}
                value={form.sessionDate}
                onChange={(event) => {
                  setError(null)
                  setForm((current) => ({
                    ...current,
                    sessionDate: event.target.value,
                  }))
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="adhoc-session-start">Start</Label>
                <Input
                  id="adhoc-session-start"
                  type="time"
                  required
                  disabled={createSession.isPending}
                  value={form.startTime}
                  onChange={(event) => {
                    setError(null)
                    setForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="adhoc-session-end">End</Label>
                <Input
                  id="adhoc-session-end"
                  type="time"
                  required
                  disabled={createSession.isPending}
                  value={form.endTime}
                  onChange={(event) => {
                    setError(null)
                    setForm((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adhoc-session-name">Name (optional)</Label>
              <Input
                id="adhoc-session-name"
                type="text"
                disabled={createSession.isPending}
                value={form.name}
                onChange={(event) => {
                  setError(null)
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adhoc-session-description">
                Description (optional)
              </Label>
              <Input
                id="adhoc-session-description"
                type="text"
                disabled={createSession.isPending}
                value={form.description}
                onChange={(event) => {
                  setError(null)
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }}
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Creating…
                </>
              ) : (
                'Create session'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
