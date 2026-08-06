import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'

export function LoginForm() {
  const { login } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setError(null)
    setIsRedirecting(true)
    try {
      await login('/dashboard')
    } catch (cause) {
      setIsRedirecting(false)
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not start sign-in. Check Cognito configuration.',
      )
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Button
        type="button"
        className="h-11 w-full rounded-md text-sm font-semibold"
        size="lg"
        disabled={isRedirecting}
        onClick={() => void handleSignIn()}
      >
        {isRedirecting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            Redirecting…
          </>
        ) : (
          'Sign in with Cognito'
        )}
      </Button>
      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
