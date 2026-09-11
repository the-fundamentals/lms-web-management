import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { getClassroomByIdOptions } from '@the-fundamentals/core-openapi/react-query'

const classroomRoute = getRouteApi('/dashboard/classrooms/$classroomId/')

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

export function ClassroomOverviewPage() {
  const { classroomId } = classroomRoute.useParams()
  const { data } = useQuery(
    getClassroomByIdOptions({ path: { id: classroomId } }),
  )

  if (!data) {
    return null
  }

  return (
    <p className="text-sm text-muted-foreground">
      Created {formatDate(data.createdDate)}
      <span className="mx-2 text-border" aria-hidden>
        ·
      </span>
      Updated {formatDate(data.lastModifiedDate)}
    </p>
  )
}
