import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AccountProfileResponse,
  ClassroomMemberRole,
} from '@the-fundamentals/core-openapi'
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

type DialogStep = 'select' | 'confirm'

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

function MemberSummaryRow({ account }: { account: AccountProfileResponse }) {
  const displayName = getProfileDisplayName(account)
  const avatarUrl = getPublicObjectUrl(account.avatarKey)

  return (
    <li className="flex items-center gap-3 px-2 py-2">
      <Avatar>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{getProfileInitials(account)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {displayName || account.email}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {account.email}
        </span>
      </span>
    </li>
  )
}

export function AddClassroomMemberDialog({
  open,
  onOpenChange,
  classroomId,
  existingMembersByAccountId,
  role,
  title,
  description = 'Search by email, select accounts, then continue to confirm.',
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
  const [step, setStep] = useState<DialogStep>('select')
  const [emailFilter, setEmailFilter] = useState('')
  const [debouncedEmailFilter, setDebouncedEmailFilter] = useState('')
  // Keep full account snapshots so the confirm step still works after the search list changes
  const [selectedAccounts, setSelectedAccounts] = useState<
    ReadonlyMap<string, AccountProfileResponse>
  >(new Map())
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
      setStep('select')
      setEmailFilter('')
      setDebouncedEmailFilter('')
      setSelectedAccounts(new Map())
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
      invalidateClassroomMembersQueries(queryClient, classroomId)
      setSelectedAccounts(new Map())
      setStep('select')
      onOpenChange(false)
    },
    onError: (cause) => {
      setError(cause instanceof Error ? cause.message : errorFallback)
    },
  })

  const accounts = data.filter(
    (account) =>
      !alreadyHasTargetRole(existingMembersByAccountId.get(account.id), role),
  )
  const selectedCount = selectedAccounts.size
  const atLimit = selectedCount >= MAX_MEMBERS_PER_REQUEST
  const selectedList = [...selectedAccounts.values()].sort((a, b) =>
    a.email.localeCompare(b.email),
  )

  const toggleAccount = (account: AccountProfileResponse) => {
    setError(null)
    setSelectedAccounts((current) => {
      const next = new Map(current)
      if (next.has(account.id)) {
        next.delete(account.id)
        return next
      }
      if (next.size >= MAX_MEMBERS_PER_REQUEST) {
        return current
      }
      next.set(account.id, account)
      return next
    })
  }

  const submitMembers = () => {
    setError(null)
    addMembers.mutate({
      path: { classroomId },
      body: {
        members: selectedList.map((account) => ({
          accountId: account.id,
          role,
        })),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'select' ? (
          <>
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
                    const isSelected = selectedAccounts.has(account.id)
                    const isDisabled =
                      addMembers.isPending || (atLimit && !isSelected)

                    return (
                      <li key={account.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                          disabled={isDisabled}
                          aria-pressed={isSelected}
                          onClick={() => toggleAccount(account)}
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
                  setStep('confirm')
                }}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm {title.toLowerCase()}</DialogTitle>
              <DialogDescription>
                Review who you are adding
                {selectedCount === 1 ? '' : ` (${selectedCount})`}, then confirm.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-48 overflow-y-auto rounded-md border">
              <ul className="flex flex-col">
                {selectedList.map((account) => (
                  <MemberSummaryRow key={account.id} account={account} />
                ))}
              </ul>
            </div>

            {/* Stub for future invite / notification options (Google Classroom–style). */}
            <fieldset className="flex flex-col gap-2 rounded-md border border-border px-3 py-3">
              <legend className="px-1 text-sm font-medium">Notifications</legend>
              <label
                htmlFor="add-member-send-invite"
                className="flex cursor-not-allowed items-start gap-3 opacity-60"
              >
                <Checkbox
                  id="add-member-send-invite"
                  checked={false}
                  disabled
                  aria-describedby="add-member-send-invite-hint"
                />
                <span className="min-w-0">
                  <span className="block text-sm">Send invitation email</span>
                  <span
                    id="add-member-send-invite-hint"
                    className="block text-xs text-muted-foreground"
                  >
                    Coming soon — these people will be added without an email for
                    now.
                  </span>
                </span>
              </label>
            </fieldset>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={addMembers.isPending}
                onClick={() => {
                  setError(null)
                  setStep('select')
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={selectedCount === 0 || addMembers.isPending}
                onClick={submitMembers}
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
          </>
        )}
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
