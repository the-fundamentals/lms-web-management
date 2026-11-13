import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MemberRow } from "../lib/member-api";

type MemberRemoveDialogProps = {
  member: MemberRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
};

export function MemberRemoveDialog({
  member,
  open,
  onOpenChange,
  onConfirm,
  pending = false,
}: MemberRemoveDialogProps) {
  const label = member?.name?.trim() || member?.email || "this member";

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent data-testid="member-remove-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} will leave this classroom. You can add them again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="member-remove-cancel" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="member-remove-confirm"
            disabled={pending || !member}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
