import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Placeholder settings page for organization preferences.
        </p>
      </div>
      <div className="flex max-w-xl flex-col gap-4 rounded-xl bg-muted/50 p-6">
        <div>
          <p className="text-sm font-medium">Organization name</p>
          <p className="text-sm text-muted-foreground">LMS Management</p>
        </div>
        <div>
          <p className="text-sm font-medium">Support email</p>
          <p className="text-sm text-muted-foreground">support@example.com</p>
        </div>
        <div>
          <p className="text-sm font-medium">Timezone</p>
          <p className="text-sm text-muted-foreground">UTC</p>
        </div>
      </div>
    </div>
  )
}
