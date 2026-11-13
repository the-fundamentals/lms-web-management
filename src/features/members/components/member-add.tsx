import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Search, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/shared/lib/cn";
import { requestFailedMessage } from "@/shared/ui/request-status";
import {
  accountIdsForAdd,
  addMembers,
  MAX_ADD_MEMBERS,
  searchAccounts,
  type MemberRow,
} from "../lib/member-api";

type MemberAddProps = {
  classroomId: string;
  activeMembers: MemberRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
};

function useDebouncedValue(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function MemberAdd({
  classroomId,
  activeMembers,
  open,
  onOpenChange,
  onAdded,
}: MemberAddProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const debounced = useDebouncedValue(query, 300);
  const activeAccountIds = activeMembers.map((m) => m.accountId);

  const accountsQuery = useQuery({
    queryKey: ["accounts-search", debounced],
    queryFn: () => searchAccounts(debounced),
    enabled: open && debounced.trim().length > 0,
  });

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected([]);
      setFailure(null);
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    const dirty = selected.length > 0 && !saving;
    const askBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", askBeforeLeaving);
    return () => window.removeEventListener("beforeunload", askBeforeLeaving);
  }, [selected.length, saving]);

  const results = (accountsQuery.data ?? []).filter(
    (account) => !activeAccountIds.includes(account.id),
  );

  function toggle(accountId: string) {
    setSelected((prev) => {
      if (prev.includes(accountId)) return prev.filter((id) => id !== accountId);
      if (prev.length >= MAX_ADD_MEMBERS) return prev;
      return [...prev, accountId];
    });
  }

  async function save() {
    if (saving) return;
    const ids = accountIdsForAdd(selected, activeAccountIds);
    if (ids.length === 0) return;
    setSaving(true);
    setFailure(null);
    try {
      await addMembers(classroomId, ids);
      onAdded();
      onOpenChange(false);
    } catch (error) {
      setFailure(error);
      setSaving(false);
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="flex w-full flex-col sm:max-w-md"
        data-testid="member-add-sheet"
        side="right"
      >
        <SheetHeader>
          <SheetTitle>Add members</SheetTitle>
          <SheetDescription>
            Search existing accounts and add them as students (up to {MAX_ADD_MEMBERS} at once).
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-search">Search by email</Label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-9"
                data-testid="member-search"
                id="member-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="email@example.com"
                value={query}
              />
            </div>
          </div>

          {failure ? (
            <Alert data-testid="member-add-error" variant="destructive">
              <CircleAlert />
              <AlertDescription>{requestFailedMessage(failure)}</AlertDescription>
            </Alert>
          ) : null}

          <ul className="flex flex-1 flex-col gap-2 overflow-y-auto" data-testid="member-search-results">
            {debounced.trim().length === 0 ? (
              <li className="type-secondary text-muted-foreground">Type an email to search.</li>
            ) : accountsQuery.isPending ? (
              <li className="type-secondary text-muted-foreground">Searching…</li>
            ) : accountsQuery.isError ? (
              <li className="type-secondary text-destructive">Search failed. Try again.</li>
            ) : results.length === 0 ? (
              <li className="type-secondary text-muted-foreground">No matching accounts.</li>
            ) : (
              results.map((account) => {
                const checked = selected.includes(account.id);
                const atCap = !checked && selected.length >= MAX_ADD_MEMBERS;
                return (
                  <li key={account.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2",
                        atCap && "opacity-50",
                      )}
                      data-testid={`member-search-row-${account.id}`}
                    >
                      <input
                        checked={checked}
                        className="mt-1 size-4 accent-primary"
                        disabled={atCap || saving}
                        onChange={() => toggle(account.id)}
                        type="checkbox"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block type-body text-foreground">
                          {account.firstName} {account.lastName}
                        </span>
                        <span className="block type-secondary text-muted-foreground">
                          {account.email}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <SheetFooter>
          <Button
            data-testid="member-add-save"
            disabled={saving || selected.length === 0}
            onClick={() => {
              void save();
            }}
            type="button"
          >
            <UserPlus aria-hidden />
            {saving ? "Adding…" : `Add ${selected.length || ""}`.trim()}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
