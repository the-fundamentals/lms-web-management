import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'

import { FundamentalsLogo } from '@/components/brand/fundamentals-logo'
import { useAuth } from '@/features/auth/AuthContext'
import { LoginForm } from '@/features/auth/components/login-form'
import '@/features/auth/pages/login.css'

/** Avoid flashing a loader when the session check finishes quickly. */
const LOADER_DELAY_MS = 300

export function LoginPage() {
  const { status, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showLoader, setShowLoader] = useState(false)

  const isPending = status === 'loading' || isAuthenticated

  // When auth already has a session, leave the login page and go to the dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  // Delay showing the spinner so a quick session check does not flash a loader on screen.
  // Clear the timer if the check finishes first or the component unmounts.
  useEffect(() => {
    if (!isPending) {
      setShowLoader(false)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShowLoader(true)
    }, LOADER_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isPending])

  if (isPending) {
    return (
      <main className="login-shell">
        <div className="login-shell__atmosphere" aria-hidden />
        {showLoader ? (
          <Loader2Icon
            className="relative z-10 size-8 animate-spin text-primary"
            aria-label="Loading"
          />
        ) : null}
      </main>
    )
  }

  return (
    <main className="login-shell">
      <div className="login-shell__atmosphere" aria-hidden />
      <div className="login-shell__content">
        <header className="login-shell__header">
          <FundamentalsLogo as="h1" size="lg" />
          <p className="login-shell__kicker">Management Console</p>
        </header>
        <LoginForm />
      </div>
    </main>
  )
}
