import type { AccountProfileResponse } from '@the-fundamentals/core-openapi'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UpdateProfileForm } from '@/features/account/components/update-profile-form'

export function UpdateProfileDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: AccountProfileResponse
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update profile</DialogTitle>
          <DialogDescription>
            Change your name or photo, then save.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <UpdateProfileForm
            key={profile.lastModifiedDate}
            profile={profile}
            onSaved={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
