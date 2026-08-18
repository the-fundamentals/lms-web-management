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
import { cn } from '@/lib/utils'

function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIsoSessionDate(localValue: string): string {
  return new Date(localValue).toISOString()
}

export function CreateSessionDialog({
  open,
  onOpenChange,
  classroomId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [sessionDate, setSessionDate] = useState(toDateTimeLocalValue(new Date()))
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setName('')
      setSessionDate(toDateTimeLocalValue(new Date()))
      setDescription('')
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
          : 'Could not create this session. Try again.',
      )
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!sessionDate) {
      setError('Choose when this session takes place.')
      return
    }

    const isoSessionDate = toIsoSessionDate(sessionDate)
    if (Number.isNaN(new Date(isoSessionDate).getTime())) {
      setError('Choose a valid date and time.')
      return
    }

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    createSession.mutate({
      path: { classroomId },
      body: {
        sessionDate: isoSessionDate,
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Create session</DialogTitle>
            <DialogDescription>
              Add a session for this classroom. Name and description are
              optional.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="session-date">Date and time</Label>
            <Input
              id="session-date"
              type="datetime-local"
              required
              value={sessionDate}
              disabled={createSession.isPending}
              onChange={(event) => {
                setError(null)
                setSessionDate(event.target.value)
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="session-name">Name</Label>
            <Input
              id="session-name"
              type="text"
              placeholder="Optional"
              value={name}
              disabled={createSession.isPending}
              onChange={(event) => {
                setError(null)
                setName(event.target.value)
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="session-description">Description</Label>
            <textarea
              id="session-description"
              placeholder="Optional"
              rows={3}
              value={description}
              disabled={createSession.isPending}
              onChange={(event) => {
                setError(null)
                setDescription(event.target.value)
              }}
              className={cn(
                'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30',
              )}
            />
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
