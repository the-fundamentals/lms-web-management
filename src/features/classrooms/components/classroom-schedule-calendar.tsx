import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import type {
  CalendarRef,
  DatesSetInfo,
  DayCellInfo,
  DayHeaderInfo,
} from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import themePlugin from '@fullcalendar/react/themes/monarch'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import 'temporal-polyfill/global'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/monarch/theme.css'

type ScheduleView = 'timeGridWeek' | 'dayGridMonth'

function monthDayCellClass(info: DayCellInfo): string | undefined {
  if (info.view.type === 'dayGridMonth' && info.isOther) {
    return 'is-other-month'
  }
  return undefined
}

function weekDayHeaderContent(info: DayHeaderInfo) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span>{info.weekdayText}</span>
      <span className={info.isToday ? 'is-today-number' : undefined}>
        {info.dayNumberText}
      </span>
    </span>
  )
}

function monthDayNumberClass(info: DayCellInfo): string | undefined {
  if (info.view.type === 'dayGridMonth' && info.isToday) {
    return 'is-today-number'
  }
  return undefined
}

export function ClassroomScheduleCalendar() {
  const calendarRef = useRef<CalendarRef>(null)
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<ScheduleView>('timeGridWeek')
  const [title, setTitle] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleDatesSet(info: DatesSetInfo) {
    setTitle(info.view.title)
    const nextView = info.view.type
    if (nextView === 'timeGridWeek' || nextView === 'dayGridMonth') {
      setView(nextView)
    }
  }

  function changeView(next: ScheduleView) {
    calendarRef.current?.getApi().changeView(next)
    setView(next)
  }

  if (!mounted) {
    return (
      <div className="classroom-schedule-calendar min-h-[36rem] rounded-xl border bg-card" />
    )
  }

  return (
    <div className="classroom-schedule-calendar flex min-h-[36rem] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Previous"
            onClick={() => {
              calendarRef.current?.getApi().prev()
            }}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Next"
            onClick={() => {
              calendarRef.current?.getApi().next()
            }}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              calendarRef.current?.getApi().today()
            }}
          >
            Today
          </Button>
          <p className="ml-2 text-sm font-medium tracking-tight">{title}</p>
        </div>
        <div
          className="inline-flex rounded-lg border bg-muted/50 p-0.5"
          role="group"
          aria-label="Calendar view"
        >
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              view === 'timeGridWeek'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={view === 'timeGridWeek'}
            onClick={() => changeView('timeGridWeek')}
          >
            Week
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              view === 'dayGridMonth'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={view === 'dayGridMonth'}
            onClick={() => changeView('dayGridMonth')}
          >
            Month
          </button>
        </div>
      </div>

      <div className="flex h-[min(70vh,44rem)] min-h-[36rem] flex-col overflow-hidden rounded-xl border bg-card">
        <FullCalendar
          ref={calendarRef}
          plugins={[themePlugin, dayGridPlugin, timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          height="100%"
          events={[]}
          datesSet={handleDatesSet}
          nowIndicator
          displayEventTime={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          // 30-minute rows stay short instead of stretching to fill the card.
          slotMinHeight={16}
          scrollTime="08:00:00"
          allDaySlot={false}
          dayHeaderFormat={{
            weekday: 'short',
            day: 'numeric',
          }}
          dayHeaderContent={
            view === 'timeGridWeek' ? weekDayHeaderContent : undefined
          }
          dayCellClass={monthDayCellClass}
          dayCellTopInnerClass={monthDayNumberClass}
        />
      </div>
    </div>
  )
}
