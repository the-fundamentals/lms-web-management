import { FundamentalsLogo } from '@/components/brand/fundamentals-logo'
import { OnboardingForm } from '@/features/account/components/onboarding-form'

/**
 * First-run profile setup after Cognito login when no account profile exists yet.
 */
export function OnboardingPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,color-mix(in_oklch,var(--primary)_22%,transparent)_0%,transparent_55%),linear-gradient(180deg,var(--primary-softer)_0%,var(--primary-soft)_58%,color-mix(in_oklch,var(--primary)_16%,var(--background))_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[length:180px_180px] bg-[url('data:image/svg+xml,%3Csvg_viewBox=%270_0_200_200%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter_id=%27n%27%3E%3CfeTurbulence_type=%27fractalNoise%27_baseFrequency=%270.85%27_numOctaves=%274%27_stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect_width=%27100%25%27_height=%27100%25%27_filter=%27url(%23n)%27/%3E%3C/svg%3E')] opacity-35 mix-blend-soft-light"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-96 flex-col items-stretch gap-7 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
        <header className="flex flex-col items-center gap-3 text-center">
          <FundamentalsLogo as="p" size="lg" />
          <p className="m-0 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:delay-75 motion-safe:duration-500">
            Account setup
          </p>
          <h1 className="m-0 text-2xl leading-tight font-semibold tracking-tight motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:delay-100 motion-safe:duration-500">
            Tell us who you are
          </h1>
          <p className="m-0 max-w-[22rem] text-[0.9rem] leading-normal text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:delay-150 motion-safe:duration-500">
            Add your name so the management console can personalize your
            workspace. You can change this later in settings.
          </p>
        </header>
        <OnboardingForm />
      </div>
    </main>
  )
}
