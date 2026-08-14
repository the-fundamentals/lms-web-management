import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { updateMyAccountProfile } from '@the-fundamentals/core-openapi'
import type { AccountProfileResponse } from '@the-fundamentals/core-openapi'
import { CircleAlertIcon, Loader2Icon, UserRoundIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setMyAccountProfileCache } from '@/features/account'
import { useAuth } from '@/features/auth'
import { getPublicObjectUrl, uploadPublicFile } from '@/features/storage'

const SAVE_FAILED = 'Could not save your profile. Try again.'
const AVATAR_UPLOAD_FAILED = 'Could not upload your photo. Try again.'

function userFacingMessage(cause: unknown, fallback: string): string {
  if (!(cause instanceof Error)) {
    return fallback
  }
  const message = cause.message.trim()
  if (
    !message ||
    message.startsWith('{') ||
    message.startsWith('[') ||
    message.length > 140
  ) {
    return fallback
  }
  return message
}

export function UpdateProfileForm({
  profile,
  onSaved,
}: {
  profile: AccountProfileResponse
  onSaved: () => void
}) {
  const queryClient = useQueryClient()
  const { getIdToken } = useAuth()
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [avatarKey, setAvatarKey] = useState(profile.avatarKey ?? '')
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(
    getPublicObjectUrl(profile.avatarKey),
  )
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const isBusy = isSubmitting || isUploadingAvatar

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    setError(null)
    setIsUploadingAvatar(true)
    try {
      const { objectKey, downloadUrl } = await uploadPublicFile(file)
      setAvatarKey(objectKey)
      setAvatarPreviewUrl(downloadUrl)
    } catch (cause) {
      setError(userFacingMessage(cause, AVATAR_UPLOAD_FAILED))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    if (!trimmedFirst || !trimmedLast) {
      setError('Enter your first and last name.')
      return
    }

    setIsSubmitting(true)
    try {
      const idToken = await getIdToken()
      if (!idToken) {
        throw new Error('Missing ID token. Sign in again and retry.')
      }

      const { data } = await updateMyAccountProfile({
        body: {
          firstName: trimmedFirst,
          lastName: trimmedLast,
          avatarKey,
        },
        headers: { 'X-ID-Token': idToken },
      })

      if (!data) {
        throw new Error(SAVE_FAILED)
      }

      setMyAccountProfileCache(queryClient, data)
      onSaved()
    } catch (cause) {
      setIsSubmitting(false)
      setError(userFacingMessage(cause, SAVE_FAILED))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="flex flex-col items-center gap-2">
        <input
          ref={avatarInputRef}
          id="update-profile-avatar"
          name="avatar"
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={isBusy}
          onChange={(event) => void handleAvatarChange(event)}
        />
        <button
          type="button"
          className="relative size-20 overflow-hidden rounded-full border border-border bg-muted outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          disabled={isBusy}
          aria-label={avatarPreviewUrl ? 'Change profile photo' : 'Add a profile photo'}
          onClick={() => avatarInputRef.current?.click()}
        >
          {avatarPreviewUrl ? (
            <img
              src={avatarPreviewUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <UserRoundIcon className="size-8" aria-hidden />
            </span>
          )}
          {isUploadingAvatar ? (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2Icon className="size-5 animate-spin" aria-hidden />
            </span>
          ) : null}
        </button>
        <p className="m-0 text-center text-xs text-muted-foreground">
          {isUploadingAvatar ? 'Uploading photo…' : 'Click to change photo'}
        </p>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="update-profile-first-name">First name</Label>
          <Input
            id="update-profile-first-name"
            name="firstName"
            autoComplete="given-name"
            required
            value={firstName}
            disabled={isBusy}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="update-profile-last-name">Last name</Label>
          <Input
            id="update-profile-last-name"
            name="lastName"
            autoComplete="family-name"
            required
            value={lastName}
            disabled={isBusy}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div
          className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-destructive"
          role="alert"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="m-0 text-sm leading-snug">{error}</p>
        </div>
      ) : null}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isBusy}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isBusy}>
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
