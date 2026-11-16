// The CLI file used React.ComponentProps without importing React.
import * as React from "react"
import { cn } from "@/shared/lib/cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // Quiet wash — muted at low opacity; gold accent was too loud while pulsing.
      className={cn("animate-pulse rounded-md bg-muted-foreground/8", className)}
      {...props}
    />
  )
}

export { Skeleton }
