import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ClassroomMemberResponse } from '@the-fundamentals/core-openapi'
import {
  createClassroomMemberPaymentPlanMutation,
  getAllClassroomPaymentPlansQueryKey,
} from '@the-fundamentals/core-openapi/react-query'
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

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback
}

function formatVndGrouped(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    value,
  )
}

function parseVndInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') {
    return null
  }
  return Number(digits)
}

const AMOUNT_STEPS = [
  { factor: 100, label: '×100' },
  { factor: 1_000, label: '×1,000' },
] as const

export function SetPaymentPlanDialog({
  open,
  onOpenChange,
  classroomId,
  member,
  currentAmount,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
  member: ClassroomMemberResponse | null
  currentAmount?: number
}) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const replacing = currentAmount !== undefined
  const createPlan = useMutation(createClassroomMemberPaymentPlanMutation())

  useEffect(() => {
    if (!open) {
      setAmount(null)
      setError(null)
      return
    }
    setAmount(currentAmount !== undefined ? currentAmount : null)
    setError(null)
  }, [open, currentAmount])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!member) {
      return
    }
    setError(null)

    if (amount === null || !Number.isInteger(amount) || amount < 0) {
      setError('Amount must be a whole number of VND, 0 or more.')
      return
    }
    const parsed = amount

    createPlan.mutate(
      {
        path: { classroomId, memberId: member.id },
        body: {
          type: 'PER_SESSION',
          amount: parsed,
          currency: 'VND',
        },
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getAllClassroomPaymentPlansQueryKey({
              path: { classroomId },
            }),
          })
          onOpenChange(false)
        },
        onError: (cause) => {
          setError(
            errorMessage(cause, 'Could not save this payment plan. Try again.'),
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>
              {replacing ? 'Change payment plan' : 'Set payment plan'}
            </DialogTitle>
            <DialogDescription>
              {member
                ? replacing
                  ? `This becomes ${member.name}'s current per-session rate and replaces the existing plan.`
                  : `Per-session rate for ${member.name}. Amount is in VND (smallest unit).`
                : 'Per-session rate. Amount is in VND (smallest unit).'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="payment-plan-amount">Amount (VND)</Label>
            <div className="relative">
              <Input
                id="payment-plan-amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                required
                placeholder="0"
                className="pr-10 font-medium tabular-nums"
                value={amount === null ? '' : formatVndGrouped(amount)}
                onChange={(event) => {
                  setError(null)
                  setAmount(parseVndInput(event.target.value))
                }}
              />
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
                ₫
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AMOUNT_STEPS.map((step) => (
                <Button
                  key={step.factor}
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={createPlan.isPending}
                  onClick={() => {
                    setError(null)
                    setAmount((current) => (current ?? 0) * step.factor)
                  }}
                >
                  {step.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Per session · VND</p>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={createPlan.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPlan.isPending || !member}
            >
              {createPlan.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : replacing ? (
                'Save plan'
              ) : (
                'Set plan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
