import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, UserMinus, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/cn";
import { publicAssetUrl } from "@/shared/lib/public-asset-url";
import { RequestStatus } from "@/shared/ui/request-status";
import { SectionLoadingSkeleton } from "@/shared/ui/section-loading-skeleton";
import {
  activeMembers,
  membersQueryOptions,
  removeMember,
  type MemberRow,
} from "../lib/member-api";
import { MemberAdd } from "./member-add";
import { MemberRemoveDialog } from "./member-remove-dialog";

type MemberListProps = {
  classroomId: string;
};

function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  if (parts.length === 1 && parts[0]!.length > 0) return parts[0]!.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function MemberRowItem({
  member,
  onRemove,
}: {
  member: MemberRow;
  onRemove: (member: MemberRow) => void;
}) {
  const src = publicAssetUrl(member.avatar);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm ring-1 ring-primary/5",
      )}
      data-testid={`member-row-${member.id}`}
    >
      <Avatar className="size-10">
        {src ? <AvatarImage alt="" src={src} /> : null}
        <AvatarFallback>{initials(member.name, member.email)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="type-body truncate text-foreground">{member.name}</p>
        <p className="type-secondary truncate text-muted-foreground">{member.email}</p>
      </div>
      {/* History entry removed for now; remove lives in the row menu. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid={`member-menu-${member.id}`}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <MoreHorizontal aria-hidden />
            <span className="sr-only">Member actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            data-testid={`member-remove-${member.id}`}
            onSelect={() => onRemove(member)}
            variant="destructive"
          >
            <UserMinus aria-hidden />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export function MemberList({ classroomId }: MemberListProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<MemberRow | null>(null);
  const [removePending, setRemovePending] = useState(false);
  const query = useQuery(membersQueryOptions(classroomId));
  const people = activeMembers(query.data ?? []);

  async function confirmRemove() {
    if (!removing || removePending) return;
    setRemovePending(true);
    try {
      await removeMember(classroomId, removing.id);
      setRemoving(null);
      await query.refetch();
    } finally {
      setRemovePending(false);
    }
  }

  return (
    <RequestStatus
      error={query.error}
      onRetry={() => {
        void query.refetch();
      }}
      pending={<SectionLoadingSkeleton rows={6} />}
      status={query.isPending ? "pending" : query.isError ? "error" : "success"}
    >
      <div className="flex flex-col gap-4" data-testid="member-list">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="type-section text-foreground">Members</p>
            <p className="type-secondary text-muted-foreground">
              Active students in this classroom.
            </p>
          </div>
          <Button
            data-testid="add-member"
            onClick={() => setAddOpen(true)}
            size="sm"
            type="button"
          >
            <UserPlus aria-hidden />
            Add
          </Button>
        </div>

        {people.length === 0 ? (
          <div
            className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-5"
            data-testid="member-list-empty"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-background text-primary shadow-sm">
              <Users aria-hidden className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="type-body text-foreground">No people yet</p>
              <p className="type-secondary text-muted-foreground">
                Add students from existing accounts to get started.
              </p>
            </div>
            <Button
              data-testid="add-member-empty"
              onClick={() => setAddOpen(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              <UserPlus aria-hidden />
              Add members
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {people.map((member) => (
              <MemberRowItem key={member.id} member={member} onRemove={setRemoving} />
            ))}
          </ul>
        )}

        <MemberAdd
          activeMembers={people}
          classroomId={classroomId}
          onAdded={() => {
            void query.refetch();
          }}
          onOpenChange={setAddOpen}
          open={addOpen}
        />

        <MemberRemoveDialog
          member={removing}
          onConfirm={() => {
            void confirmRemove();
          }}
          onOpenChange={(open) => {
            if (!open) setRemoving(null);
          }}
          open={removing !== null}
          pending={removePending}
        />
      </div>
    </RequestStatus>
  );
}
