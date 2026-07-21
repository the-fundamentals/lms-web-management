import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/demo')({ component: DemoPage })

function DemoPage() {
  const [fetchCount, setFetchCount] = useState(0)

  const { data, isFetching } = useQuery({
    queryKey: ['greeting', fetchCount],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400))
      return `Hello from TanStack Query! (fetch #${fetchCount + 1})`
    },
  })

  return (
    <div className="flex flex-col items-start gap-6 p-8">
      <h1 className="text-3xl font-bold">shadcn/ui + TanStack Query</h1>

      <p data-testid="query-result" className="text-lg text-muted-foreground">
        {isFetching ? 'Loading…' : data}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button data-testid="refetch" onClick={() => setFetchCount((c) => c + 1)}>
          Fetch greeting
        </Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </div>
  )
}
