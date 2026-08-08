import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { updateMyAccountProfile } from '@the-fundamentals/core-openapi'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  clearMyAccountProfileCache,
  setMyAccountProfileCache,
} from '@/features/account'
import { useAuth } from '@/features/auth/AuthContext'

export function OnboardingForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getIdToken, logout, session } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBusy = isSubmitting || isLoggingOut

  const email = session?.user.email

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    if (!trimmedFirst || !trimmedLast) {
      setError('Enter your first and last name to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error('Missing ID token. Sign in again and retry.')
      }

      const { data, error: apiError } = await updateMyAccountProfile({
        body: { firstName: trimmedFirst, lastName: trimmedLast },
        headers: { 'X-ID-Token': idToken },
      })

      if (data) {
        setMyAccountProfileCache(queryClient, data)
        await navigate({ to: '/dashboard', replace: true })
        return
      }

      throw new Error(apiError.message)
    } catch (cause) {
      setIsSubmitting(false)
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not save your profile. Try again.',
      )
    }
  }

  return (
    <form
      className="flex w-full flex-col gap-5 text-left motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:delay-200 motion-safe:duration-500"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      {email ? (
        <p className="m-0 rounded-lg border border-border/80 bg-background/70 px-3.5 py-2.5 text-xs text-muted-foreground">
          Signed in as{' '}
          <span className="font-semibold break-all text-foreground">
            {email}
          </span>
        </p>
      ) : null}

      <div className="grid gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="onboarding-first-name">First name</Label>
          <Input
            id="onboarding-first-name"
            name="firstName"
            autoComplete="given-name"
            autoFocus
            required
            value={firstName}
            disabled={isBusy}
            placeholder="Alex"
            className="h-11 rounded-md bg-background/70 px-3 text-sm"
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="onboarding-last-name">Last name</Label>
          <Input
            id="onboarding-last-name"
            name="lastName"
            autoComplete="family-name"
            required
            value={lastName}
            disabled={isBusy}
            placeholder="Nguyen"
            className="h-11 rounded-md bg-background/70 px-3 text-sm"
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Button
          type="submit"
          className="h-11 w-full rounded-md text-sm font-semibold"
          size="lg"
          disabled={isBusy}
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            'Continue to dashboard'
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full rounded-md text-sm font-medium text-muted-foreground"
          size="lg"
          disabled={isBusy}
          onClick={() => {
            setError(null)
            setIsLoggingOut(true)
            clearMyAccountProfileCache(queryClient)
            void logout().catch((cause: unknown) => {
              setIsLoggingOut(false)
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Could not sign out. Try again.',
              )
            })
          }}
        >
          {isLoggingOut ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Signing out…
            </>
          ) : (
            'Sign out'
          )}
        </Button>
      </div>

      {error ? (
        <p className="m-0 text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
