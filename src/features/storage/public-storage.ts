import { uploadToStorage } from '@the-fundamentals/core-openapi'
import type { UploadToStorageResponse } from '@the-fundamentals/core-openapi'

import { loadPublicStorageConfig } from '@/features/storage/config'

const UPLOAD_FAILED = 'Could not start a public upload. Try again.'
const PUT_FAILED = 'Could not upload the file. Try again.'
const NOT_AN_IMAGE = 'Choose an image file.'

/**
 * Rejects blobs that are not {@code image/*}.
 */
export function ensureImageFile(file: Blob): void {
  if (!file.type.startsWith('image/')) {
    throw new Error(NOT_AN_IMAGE)
  }
}

/**
 * Asks the Core API for a public-bucket presigned upload.
 *
 * Calls {@link uploadToStorage} directly (not React Query).
 */
export async function createPublicUpload(): Promise<UploadToStorageResponse> {
  const { data } = await uploadToStorage({
    body: { isPublic: true },
  })
  if (!data?.uploadUrl || !data.objectKey) {
    throw new Error(UPLOAD_FAILED)
  }
  return data
}

/**
 * PUTs a blob to a presigned URL. No file type or size checks.
 */
export async function putFileToPresignedUrl(
  uploadUrl: string,
  file: Blob,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
  })
  if (!response.ok) {
    throw new Error(PUT_FAILED)
  }
}

export type PublicUploadResult = {
  objectKey: string
  /** Landing-zone GET URL for previewing the just-uploaded object. */
  downloadUrl: string
}

/**
 * Requests public presigned URLs, PUTs {@code file} to {@code uploadUrl}.
 *
 * @returns landing-zone {@code objectKey} and GET {@code downloadUrl}
 */
export async function uploadPublicFile(file: Blob): Promise<PublicUploadResult> {
  ensureImageFile(file)
  const { uploadUrl, objectKey, downloadUrl } = await createPublicUpload()
  await putFileToPresignedUrl(uploadUrl, file)
  if (!downloadUrl) {
    throw new Error(UPLOAD_FAILED)
  }
  return { objectKey, downloadUrl }
}

/**
 * Builds a public object URL from {@code VITE_PUBLIC_STORAGE_BASE_URL} + key.
 *
 * @returns {@code null} when the key is empty
 */
export function getPublicObjectUrl(objectKey: string | null | undefined): string | null {
  const key = objectKey?.trim().replace(/^\/+/, '')
  if (!key) {
    return null
  }
  const { baseUrl } = loadPublicStorageConfig()
  return `${baseUrl}/${key}`
}
