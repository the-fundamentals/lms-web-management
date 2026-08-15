import type { ReactNode } from 'react'
import type { ComponentProps } from 'react'

import type { Button } from '@/components/ui/button'

export type ConfirmActionVariant = 'default' | 'destructive'

export type ConfirmActionRequest = {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmActionVariant
  icon?: ReactNode
  children?: ReactNode
  className?: string
  confirmButtonProps?: ComponentProps<typeof Button>
  cancelButtonProps?: ComponentProps<typeof Button>
}

export type ConfirmActionDialogProps = ConfirmActionRequest & {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
  confirmPending?: boolean
  confirmDisabled?: boolean
}
