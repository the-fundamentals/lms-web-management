import { CircleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import type { ConfirmActionDialogProps } from '@/components/confirm-action/types'

/**
 * Presentational confirm dialog. Use directly for controlled flows, or via
 * {@link ConfirmActionProvider} / {@link useConfirmAction} for a global prompt.
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  variant = 'default',
  icon,
  children,
  className,
  confirmPending = false,
  confirmDisabled = false,
  confirmButtonProps,
  cancelButtonProps,
}: ConfirmActionDialogProps) {
  const showIcon = icon !== null && (icon !== undefined || variant === 'destructive')

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && confirmPending) {
      return
    }
    if (!nextOpen) {
      onCancel?.()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn('sm:max-w-sm', className)}
        onPointerDownOutside={(event) => {
          if (confirmPending) {
            event.preventDefault()
          }
        }}
        onEscapeKeyDown={(event) => {
          if (confirmPending) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader>
          {showIcon ? (
            <div
              className={cn(
                'mb-1 flex size-10 items-center justify-center rounded-full',
                variant === 'destructive'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {icon ?? <CircleAlertIcon className="size-5" aria-hidden />}
            </div>
          ) : null}
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={confirmPending}
            {...cancelButtonProps}
            onClick={(event) => {
              cancelButtonProps?.onClick?.(event)
              if (!event.defaultPrevented) {
                handleOpenChange(false)
              }
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={confirmDisabled || confirmPending}
            {...confirmButtonProps}
            onClick={(event) => {
              confirmButtonProps?.onClick?.(event)
              if (!event.defaultPrevented) {
                onConfirm()
              }
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
