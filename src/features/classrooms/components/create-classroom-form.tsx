import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { createClassroom } from '@the-fundamentals/core-openapi'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateClassroomForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Enter a classroom name to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error: apiError } = await createClassroom({
        body: { name: trimmedName },
      })

      if (data) {
        await navigate({ to: '/dashboard/classrooms/list', replace: true })
        return
      }

      throw new Error(apiError.message)
    } catch (cause) {
      setIsSubmitting(false)
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create the classroom. Try again.',
      )
    }
  }

  return (
    <form
      className="flex w-full max-w-md flex-col gap-5"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <div className="grid gap-1.5">
        <Label htmlFor="classroom-name">Name</Label>
        <Input
          id="classroom-name"
          name="name"
          autoComplete="off"
          autoFocus
          required
          value={name}
          disabled={isSubmitting}
          placeholder="English Foundations A"
          className="h-11 rounded-md px-3 text-sm"
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          className="h-11 rounded-md px-4 text-sm font-semibold"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Creating…
            </>
          ) : (
            'Create classroom'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-md px-4 text-sm"
          size="lg"
          disabled={isSubmitting}
          asChild
        >
          <Link to="/dashboard/classrooms/list">Cancel</Link>
        </Button>
      </div>

      {error ? (
        <p className="m-0 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
