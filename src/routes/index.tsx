import { createFileRoute, redirect } from '@tanstack/react-router'

import { LoginForm } from '@/components/auth/login-form'
import { isAuthenticated } from '@/utils/auth'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/40 px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.02_250)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.94_0.03_80)_0%,_transparent_45%)]"
      />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
            LMS
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Management Console
          </h1>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
