import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHomePage,
})

/** PLACEHOLDER: mock dashboard overview until real metrics/API land. */
function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here is a mock overview of your management console.
        </p>
      </div>
      <div className="min-h-[50vh] flex-1 rounded-xl bg-muted/50 p-6">
        <h2 className="text-lg font-medium">Recent activity</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Mock content placeholder for charts and activity feeds.
        </p>
      </div>
    </div>
  )
}
