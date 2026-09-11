import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClassroomMutation } from '@the-fundamentals/core-openapi/react-query'
import { ImageIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { invalidateClassroomsQueries } from '@/features/classrooms/classrooms-query'
import { uploadPublicFile } from '@/features/storage'

const BANNER_UPLOAD_FAILED = 'Could not upload the banner. Try again.'

export function CreateClassroomForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [bannerKey, setBannerKey] = useState('')
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const createClassroom = useMutation({
    ...createClassroomMutation(),
    onSuccess: async () => {
      invalidateClassroomsQueries(queryClient)
      await navigate({ to: '/dashboard/classrooms/list', replace: true })
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create the classroom. Try again.',
      )
    },
  })

  const isBusy = createClassroom.isPending || isUploadingBanner

  async function handleBannerChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    setError(null)
    setIsUploadingBanner(true)
    try {
      const { objectKey, downloadUrl } = await uploadPublicFile(file)
      setBannerKey(objectKey)
      setBannerPreviewUrl(downloadUrl)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : BANNER_UPLOAD_FAILED,
      )
    } finally {
      setIsUploadingBanner(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Enter a classroom name to continue.')
      return
    }

    createClassroom.mutate({
      body: {
        name: trimmedName,
        ...(bannerKey ? { bannerKey } : {}),
      },
    })
  }

  return (
    <form
      className="flex w-full max-w-xl flex-col gap-5"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <div className="grid gap-1.5">
        <Label htmlFor="classroom-banner">Banner</Label>
        <input
          ref={bannerInputRef}
          id="classroom-banner"
          name="banner"
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={isBusy}
          onChange={(event) => void handleBannerChange(event)}
        />
        <button
          type="button"
          className="relative aspect-[2.4/1] w-full overflow-hidden rounded-md border border-border bg-muted outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          disabled={isBusy}
          aria-label={bannerPreviewUrl ? 'Change banner image' : 'Add a banner image'}
          onClick={() => bannerInputRef.current?.click()}
        >
          {bannerPreviewUrl ? (
            <img
              src={bannerPreviewUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
              <ImageIcon className="size-8" aria-hidden />
              <span className="text-sm">Add a banner</span>
            </span>
          )}
          {isUploadingBanner ? (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2Icon className="size-5 animate-spin" aria-hidden />
            </span>
          ) : null}
        </button>
        <p className="text-xs text-muted-foreground">
          {isUploadingBanner
            ? 'Uploading banner…'
            : bannerPreviewUrl
              ? 'Banner uploaded. Click to replace.'
              : 'Optional. Click to upload an image.'}
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="classroom-name">Name</Label>
        <Input
          id="classroom-name"
          name="name"
          autoComplete="off"
          autoFocus
          required
          value={name}
          disabled={isBusy}
          placeholder="English Foundations A"
          className="h-11 rounded-md px-3 text-sm"
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          className="h-11 rounded-md px-4 text-sm font-semibold"
          size="lg"
          disabled={isBusy}
        >
          {createClassroom.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Creating…
            </>
          ) : (
            'Create classroom'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-md px-4 text-sm"
          size="lg"
          disabled={isBusy}
          asChild
        >
          <Link to="/dashboard/classrooms/list">Cancel</Link>
        </Button>
      </div>

      {error ? (
        <p className="m-0 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
