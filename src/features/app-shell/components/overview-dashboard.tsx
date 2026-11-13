import { BookOpen, CalendarClock, Plus, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type OverviewStats = {
  classroomCount: number;
  memberTotal: number;
};

type OverviewDashboardProps = {
  stats: OverviewStats;
};

/**
 * Overview home chrome. Live counts come from the route (classroom query) so
 * app-shell does not import the classroom feature.
 * Full list lives on `/classrooms` (Request Changes: Overview vs Classrooms).
 */
export function OverviewDashboard({ stats }: OverviewDashboardProps) {
  return (
    <div className="@container/main flex flex-col gap-6" data-testid="overview-dashboard">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="type-page text-foreground">Overview</h2>
          <p className="type-body text-muted-foreground">
            Snapshot of your teaching workspace. Open Classrooms for the full list.
          </p>
        </div>
        <Button asChild size="lg">
          <Link data-testid="overview-new-classroom" to="/classrooms/new">
            <Plus aria-hidden />
            New classroom
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Classrooms</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.classroomCount}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <BookOpen />
                Live
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="font-medium text-foreground">
              {stats.classroomCount === 0 ? "None yet" : "From your classroom list"}
            </div>
            <div className="text-muted-foreground">Counts update when you create or rename.</div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {stats.memberTotal}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Users />
                Live
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="font-medium text-foreground">Across listed classrooms</div>
            <div className="text-muted-foreground">Member management lands in a later unit.</div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Sessions</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              —
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <CalendarClock />
                Later
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="font-medium text-foreground">Not tracked here yet</div>
            <div className="text-muted-foreground">Session counts come with the sessions unit.</div>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Getting around</CardDescription>
          <CardTitle className="type-section text-foreground">Classrooms</CardTitle>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <p className="type-secondary text-muted-foreground">
            Open Classrooms for search, list/card views, and the live list.
          </p>
          <Button asChild size="lg">
            <Link data-testid="overview-to-classrooms" to="/classrooms">
              <BookOpen aria-hidden />
              View classrooms
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
