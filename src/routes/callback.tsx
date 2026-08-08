import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

import { resolvePostLoginPath, clearMyAccountProfileCache } from '@/features/account'
import { getAuth } from '@/features/auth'

export const Route = createFileRoute('/callback')({
  component: CallbackPage,
})

function CallbackPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  // After Cognito returns with a code: finish login, then send onboarded users to
  // the dashboard and everyone else to onboarding (profile 404). Seeds the profile cache.
  useEffect(() => {
    let cancelled = false

    void getAuth()
      .handleLoginCallback()
      .then(() => {
        // Drop any previous user's cached profile before resolving destination.
        clearMyAccountProfileCache(queryClient)
        return resolvePostLoginPath(queryClient)
      })
      .then((to) => {
        if (!cancelled) {
          void navigate({ to })
        }
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setError(
          cause instanceof Error
            ? cause.message
            : 'Sign-in failed. You can try again from the login page.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [navigate, queryClient])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
      {error ? (
        <>
          <p className="text-destructive" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => void navigate({ to: '/' })}
          >
            Back to sign in
          </button>
        </>
      ) : (
        <p className="text-muted-foreground">Completing sign-in…</p>
      )}
    </main>
  )
}
