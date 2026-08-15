import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { ConfirmActionDialog } from '@/components/confirm-action/confirm-action-dialog'
import type {
  ConfirmActionDialogProps,
  ConfirmActionRequest,
} from '@/components/confirm-action/types'

type ConfirmActionFn = (request: ConfirmActionRequest) => Promise<boolean>

const ConfirmActionContext = createContext<ConfirmActionFn | null>(null)

/**
 * App-level confirm prompt. Wrap once (e.g. in the root layout), then call
 * {@link useConfirmAction} from anywhere.
 *
 * Pass {@code renderDialog} to swap or wrap {@link ConfirmActionDialog}.
 */
export function ConfirmActionProvider({
  children,
  renderDialog,
}: {
  children: ReactNode
  renderDialog?: (props: ConfirmActionDialogProps) => ReactNode
}) {
  const [request, setRequest] = useState<ConfirmActionRequest | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirmAction = useCallback((next: ConfirmActionRequest) => {
    resolverRef.current?.(false)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setRequest(next)
    })
  }, [])

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setRequest(null)
  }, [])

  const dialogProps: ConfirmActionDialogProps = useMemo(
    () => ({
      open: request !== null,
      onOpenChange: (open) => {
        if (!open) {
          settle(false)
        }
      },
      onConfirm: () => settle(true),
      title: request?.title ?? '',
      description: request?.description,
      confirmLabel: request?.confirmLabel,
      cancelLabel: request?.cancelLabel,
      variant: request?.variant,
      icon: request?.icon,
      children: request?.children,
      className: request?.className,
      confirmButtonProps: request?.confirmButtonProps,
      cancelButtonProps: request?.cancelButtonProps,
    }),
    [request, settle],
  )

  return (
    <ConfirmActionContext.Provider value={confirmAction}>
      {children}
      {request
        ? (renderDialog?.(dialogProps) ?? (
            <ConfirmActionDialog {...dialogProps} />
          ))
        : null}
    </ConfirmActionContext.Provider>
  )
}

/**
 * Returns a function that opens the global confirm dialog and resolves
 * {@code true} if confirmed, {@code false} if cancelled.
 */
export function useConfirmAction(): ConfirmActionFn {
  const confirmAction = useContext(ConfirmActionContext)
  if (!confirmAction) {
    throw new Error('useConfirmAction must be used within ConfirmActionProvider')
  }
  return confirmAction
}
