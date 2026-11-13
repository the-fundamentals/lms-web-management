import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SESSION_STATUS_FILTER_ORDER,
  sessionStatusLabel,
  type SessionStatusFilter,
} from "../lib/session-buckets";
import type { ClassroomSessionStatus } from "@/generated/types.gen";

type SessionStatusFilterProps = {
  value: SessionStatusFilter;
  onChange: (next: SessionStatusFilter) => void;
};

/** Filter icon → dropdown checkboxes for Open / Completed / Cancelled (all on by default). */
export function SessionStatusFilterControl({ value, onChange }: SessionStatusFilterProps) {
  function toggle(status: ClassroomSessionStatus) {
    onChange({ ...value, [status]: !value[status] });
  }

  const activeCount = SESSION_STATUS_FILTER_ORDER.filter((s) => value[s]).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Filter by status"
          data-testid="sessions-status-filter"
          size="sm"
          type="button"
          variant="outline"
        >
          <ListFilter aria-hidden />
          Filter
          {activeCount < SESSION_STATUS_FILTER_ORDER.length ? (
            <span className="tabular-nums text-muted-foreground">({activeCount})</span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-testid="sessions-status-filter-menu">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SESSION_STATUS_FILTER_ORDER.map((status) => (
          <DropdownMenuCheckboxItem
            checked={value[status]}
            data-testid={`sessions-status-${status.toLowerCase()}`}
            key={status}
            onCheckedChange={() => toggle(status)}
            onSelect={(event) => event.preventDefault()}
          >
            {sessionStatusLabel(status)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
