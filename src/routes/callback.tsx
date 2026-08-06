import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { getAuth } from '@/features/auth'

export const Route = createFileRoute('/callback')({
  component: CallbackPage,
})

function CallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  // After Cognito redirects back here with a code, finish login then go to the dashboard.
  // If this page unmounts mid-flight, ignore the result so we do not navigate/setState late.
  useEffect(() => {
    let cancelled = false

    void getAuth()
      .handleLoginCallback()
      .then(() => {
        if (!cancelled) {
          void navigate({ to: '/dashboard' })
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
  }, [navigate])

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
