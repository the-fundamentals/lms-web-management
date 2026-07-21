import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHomePage,
})

function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here is a mock overview of your management console.
        </p>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Active users</p>
          <p className="mt-2 text-3xl font-semibold">1,284</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Courses</p>
          <p className="mt-2 text-3xl font-semibold">48</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Pending reviews</p>
          <p className="mt-2 text-3xl font-semibold">12</p>
        </div>
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
