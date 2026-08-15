import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClassroomMemberRole } from '@the-fundamentals/core-openapi'
import { createClassroomMembersMutation } from '@the-fundamentals/core-openapi/react-query'
import { Loader2Icon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  getAllAccountsOptions,
  getProfileDisplayName,
  getProfileInitials,
} from '@/features/account'
import { invalidateClassroomMembersQueries } from '@/features/classrooms/classrooms-query'
import { getPublicObjectUrl } from '@/features/storage'

const EMAIL_FILTER_DEBOUNCE_MS = 300
const MAX_MEMBERS_PER_REQUEST = 30

const TEACHER_ROLES = new Set<ClassroomMemberRole>(['ADMIN', 'TEACHER'])

function alreadyHasTargetRole(
  existingRole: ClassroomMemberRole | undefined,
  targetRole: ClassroomMemberRole,
): boolean {
  if (!existingRole) {
    return false
  }
  if (targetRole === 'STUDENT') {
    return existingRole === 'STUDENT'
  }
  return TEACHER_ROLES.has(existingRole)
}

function addActionLabel(role: ClassroomMemberRole, count: number): string {
  const noun = role === 'STUDENT' ? 'student' : 'teacher'
  if (count <= 1) {
    return `Add ${count} ${noun}`
  }
  return `Add ${count} ${noun}s`
}

export function AddClassroomMemberDialog({
  open,
  onOpenChange,
  classroomId,
  existingMembersByAccountId,
  role,
  title,
  description = 'Search by email, select accounts, then add them.',
  errorFallback,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
  existingMembersByAccountId: ReadonlyMap<string, ClassroomMemberRole>
  role: ClassroomMemberRole
  title: string
  description?: string
  errorFallback: string
}) {
  const queryClient = useQueryClient()
  const [emailFilter, setEmailFilter] = useState('')
  const [debouncedEmailFilter, setDebouncedEmailFilter] = useState('')
  const [selectedAccountIds, setSelectedAccountIds] = useState<ReadonlySet<string>>(
    new Set(),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedEmailFilter(emailFilter.trim())
    }, EMAIL_FILTER_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [emailFilter])

  useEffect(() => {
    if (!open) {
      setEmailFilter('')
      setDebouncedEmailFilter('')
      setSelectedAccountIds(new Set())
      setError(null)
    }
  }, [open])

  const { data = [], isFetching } = useQuery({
    ...getAllAccountsOptions({
      body: {
        page: 0,
        size: 20,
        sortBy: 'email',
        sortDirection: 'ASC',
        ...(debouncedEmailFilter
          ? {
              filters: [
                {
                  field: 'email',
                  operator: 'like',
                  value: debouncedEmailFilter,
                },
              ],
            }
          : {}),
      },
    }),
    enabled: open,
  })

  const addMembers = useMutation({
    ...createClassroomMembersMutation(),
    onSuccess: () => {
      invalidateClassroomMembersQueries(queryClient)
      setSelectedAccountIds(new Set())
    },
    onError: (cause) => {
      setError(cause instanceof Error ? cause.message : errorFallback)
    },
  })

  const accounts = data.filter(
    (account) =>
      !alreadyHasTargetRole(existingMembersByAccountId.get(account.id), role),
  )
  const selectedCount = selectedAccountIds.size
  const atLimit = selectedCount >= MAX_MEMBERS_PER_REQUEST

  const toggleAccount = (accountId: string) => {
    setError(null)
    setSelectedAccountIds((current) => {
      const next = new Set(current)
      if (next.has(accountId)) {
        next.delete(accountId)
        return next
      }
      if (next.size >= MAX_MEMBERS_PER_REQUEST) {
        return current
      }
      next.add(accountId)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Input
          type="search"
          autoFocus
          placeholder="Filter by email"
          value={emailFilter}
          disabled={addMembers.isPending}
          onChange={(event) => {
            setError(null)
            setEmailFilter(event.target.value)
          }}
        />

        <div className="max-h-72 overflow-y-auto">
          {isFetching && accounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Searching…
            </p>
          ) : accounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No accounts found.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {accounts.map((account) => {
                const displayName = getProfileDisplayName(account)
                const avatarUrl = getPublicObjectUrl(account.avatarKey)
                const isSelected = selectedAccountIds.has(account.id)
                const isDisabled =
                  addMembers.isPending || (atLimit && !isSelected)

                return (
                  <li key={account.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                      disabled={isDisabled}
                      aria-pressed={isSelected}
                      onClick={() => toggleAccount(account.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        tabIndex={-1}
                        className="pointer-events-none"
                        aria-hidden
                      />
                      <Avatar>
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt="" />
                        ) : null}
                        <AvatarFallback>
                          {getProfileInitials(account)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {displayName || account.email}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {account.email}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : atLimit ? (
          <p className="text-sm text-muted-foreground">
            You can add up to {MAX_MEMBERS_PER_REQUEST} people at a time.
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            disabled={selectedCount === 0 || addMembers.isPending}
            onClick={() => {
              setError(null)
              addMembers.mutate({
                path: { classroomId },
                body: {
                  members: [...selectedAccountIds].map((accountId) => ({
                    accountId,
                    role,
                  })),
                },
              })
            }}
          >
            {addMembers.isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Adding…
              </>
            ) : (
              addActionLabel(role, selectedCount)
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddStudentDialog(
  props: Omit<
    Parameters<typeof AddClassroomMemberDialog>[0],
    'role' | 'title' | 'errorFallback'
  >,
) {
  return (
    <AddClassroomMemberDialog
      {...props}
      role="STUDENT"
      title="Add students"
      errorFallback="Could not add these students. Try again."
    />
  )
}

export function AddTeacherDialog(
  props: Omit<
    Parameters<typeof AddClassroomMemberDialog>[0],
    'role' | 'title' | 'errorFallback'
  >,
) {
  return (
    <AddClassroomMemberDialog
      {...props}
      role="TEACHER"
      title="Add teachers"
      errorFallback="Could not add these teachers. Try again."
    />
  )
}
