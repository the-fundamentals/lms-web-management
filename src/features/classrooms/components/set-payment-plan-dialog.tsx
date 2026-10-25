import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClassroomMemberPaymentPlanMutation } from '@the-fundamentals/core-openapi/react-query'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { invalidateClassroomPaymentPlansQueries } from '@/features/classrooms/classrooms-query'

/**
 * Create/replace a member's current payment plan via CO create.
 * Server sets effectiveFrom=now and effectiveTo=null; those are not in the body.
 * VND has 0 fraction digits, so the amount field is both display and API units.
 */

const DEFAULT_CURRENCY = 'VND'

export function SetPaymentPlanDialog({
  open,
  onOpenChange,
  classroomId,
  memberId,
  memberName,
  hasExistingPlan,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
  memberId: string
  memberName: string
  hasExistingPlan: boolean
}) {
  const queryClient = useQueryClient()
  const [amountInput, setAmountInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setAmountInput('')
      setError(null)
    }
  }, [open])

  const createPlan = useMutation({
    ...createClassroomMemberPaymentPlanMutation(),
    onSuccess: () => {
      invalidateClassroomPaymentPlansQueries(queryClient, classroomId)
      onOpenChange(false)
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not set the payment plan. Try again.',
      )
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmed = amountInput.trim().replace(/,/g, '')
    const amount = Number(trimmed)
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Enter a whole amount greater than zero.')
      return
    }

    createPlan.mutate({
      path: { classroomId, memberId },
      body: {
        type: 'PER_SESSION',
        amount,
        currency: DEFAULT_CURRENCY,
      },
    })
  }

  const title = hasExistingPlan ? 'Set plan' : 'Add plan'
  const submitLabel = hasExistingPlan ? 'Set plan' : 'Add plan'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Per-session rate in {DEFAULT_CURRENCY} for {memberName}. Takes
              effect immediately
              {hasExistingPlan ? '; replaces the current plan' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment-plan-amount">
              Amount ({DEFAULT_CURRENCY})
            </Label>
            <Input
              id="payment-plan-amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              autoFocus
              disabled={createPlan.isPending}
              value={amountInput}
              onChange={(event) => {
                setError(null)
                setAmountInput(event.target.value)
              }}
              placeholder="e.g. 150000"
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={createPlan.isPending}>
              {createPlan.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
