import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table2,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/cn";
import { publicAssetUrl } from "@/shared/lib/public-asset-url";
import { RequestStatus } from "@/shared/ui/request-status";
import { classroomsQueryOptions, type ClassroomRow } from "../lib/classroom-api";
import { classroomListFilter } from "../lib/classroom-filter";
import {
  formatClassroomCreated,
  formatClassroomPlan,
  formatMemberCount,
} from "../lib/format-classroom";

type ClassroomView = "list" | "card" | "table";

function useDebouncedValue(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function ClassroomBannerThumb({ classroom, large }: { classroom: ClassroomRow; large?: boolean }) {
  const src = publicAssetUrl(classroom.bannerKey);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-muted text-primary",
        large ? "h-36 w-full rounded-t-xl" : "size-11 rounded-lg",
      )}
    >
      {src ? (
        <img alt="" className="size-full object-cover" src={src} />
      ) : (
        <BookOpen aria-hidden className={large ? "size-8" : "size-4"} strokeWidth={1.75} />
      )}
    </span>
  );
}

function ClassroomListRow({ classroom }: { classroom: ClassroomRow }) {
  return (
    <li>
      <Link
        className={cn(
          "group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 text-card-foreground shadow-sm",
          "ring-1 ring-primary/5 transition-transform duration-200 hover:-translate-y-px",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
        data-testid={`classroom-row-${classroom.id}`}
        params={{ classroomId: classroom.id }}
        to="/classrooms/$classroomId"
      >
        <ClassroomBannerThumb classroom={classroom} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="type-body truncate text-foreground">{classroom.name}</span>
            <Badge variant="outline">{classroom.status}</Badge>
          </span>
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 type-secondary text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users aria-hidden className="size-3.5" />
              {formatMemberCount(classroom.numberOfMembers)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet aria-hidden className="size-3.5" />
              {formatClassroomPlan(classroom)}
            </span>
            <span>Created {formatClassroomCreated(classroom.createdDate)}</span>
          </span>
        </span>
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}

function ClassroomCard({ classroom }: { classroom: ClassroomRow }) {
  return (
    <li>
      <Link
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
          "ring-1 ring-primary/5 transition-transform duration-200 hover:-translate-y-px",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
        data-testid={`classroom-row-${classroom.id}`}
        params={{ classroomId: classroom.id }}
        to="/classrooms/$classroomId"
      >
        <ClassroomBannerThumb classroom={classroom} large />
        <span className="flex flex-1 flex-col gap-3 p-4">
          <span className="flex items-start justify-between gap-2">
            <span className="type-section text-balance text-foreground">{classroom.name}</span>
            <Badge variant="outline">{classroom.status}</Badge>
          </span>
          <span className="mt-auto flex flex-col gap-1.5 type-secondary text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden className="size-3.5" />
              {formatMemberCount(classroom.numberOfMembers)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet aria-hidden className="size-3.5" />
              {formatClassroomPlan(classroom)}
            </span>
            <span>Created {formatClassroomCreated(classroom.createdDate)}</span>
          </span>
        </span>
      </Link>
    </li>
  );
}

export function ClassroomList() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ClassroomView>("list");
  const debouncedSearch = useDebouncedValue(search, 300);
  const filter = classroomListFilter(debouncedSearch);
  const query = useQuery(classroomsQueryOptions(filter));
  const classrooms = query.data ?? [];
  const searching = debouncedSearch.trim().length > 0;

  return (
    <div className="@container/main flex flex-col gap-6" data-testid="classroom-dashboard">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="type-page text-foreground">Your classrooms</h2>
          <p className="type-body text-muted-foreground">
            Open a classroom to manage it, or start a new one.
          </p>
        </div>
        <Button asChild size="lg">
          <Link data-testid="new-classroom" to="/classrooms/new">
            <Plus aria-hidden />
            New classroom
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search classrooms"
            className="h-10 pl-9"
            data-testid="classroom-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name…"
            value={search}
          />
        </div>
        <div
          aria-label="Classroom view"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card p-1"
          data-testid="classroom-view-selector"
          role="group"
        >
          <Button
            aria-pressed={view === "list"}
            className={cn(view === "list" && "bg-muted")}
            data-testid="classroom-view-list"
            onClick={() => setView("list")}
            size="sm"
            type="button"
            variant="ghost"
          >
            <LayoutList aria-hidden />
            List
          </Button>
          <Button
            aria-pressed={view === "card"}
            className={cn(view === "card" && "bg-muted")}
            data-testid="classroom-view-card"
            onClick={() => setView("card")}
            size="sm"
            type="button"
            variant="ghost"
          >
            <LayoutGrid aria-hidden />
            Card
          </Button>
          <Button
            aria-pressed={false}
            data-testid="classroom-view-table"
            disabled
            size="sm"
            title="Table view comes later"
            type="button"
            variant="ghost"
          >
            <Table2 aria-hidden />
            Table
          </Button>
        </div>
      </div>

      <RequestStatus
        error={query.error}
        onRetry={() => {
          void query.refetch();
        }}
        status={query.isPending ? "pending" : query.isError ? "error" : "success"}
      >
        {classrooms.length === 0 ? (
          <div
            className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm ring-1 ring-primary/5"
            data-testid="classroom-empty"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
              <BookOpen aria-hidden className="size-6" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="type-body text-foreground">
                {searching ? "No classrooms match that search." : "There are no classrooms yet."}
              </p>
              <p className="type-secondary text-muted-foreground">
                {searching
                  ? "Try another name, or clear the search."
                  : "Create one to get started. Sessions come later."}
              </p>
            </div>
            {!searching ? (
              <Button asChild size="lg">
                <Link to="/classrooms/new">
                  <Plus aria-hidden />
                  New classroom
                </Link>
              </Button>
            ) : null}
          </div>
        ) : view === "card" ? (
          <ul
            className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-3"
            data-testid="classroom-list"
            data-view="card"
          >
            {classrooms.map((classroom) => (
              <ClassroomCard classroom={classroom} key={classroom.id} />
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-3" data-testid="classroom-list" data-view="list">
            {classrooms.map((classroom) => (
              <ClassroomListRow classroom={classroom} key={classroom.id} />
            ))}
          </ul>
        )}
      </RequestStatus>
    </div>
  );
}
