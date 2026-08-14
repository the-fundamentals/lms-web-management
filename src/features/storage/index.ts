/**
 * Storage feature — public S3 uploads via the Core SDK + public object URLs.
 */

export { loadPublicStorageConfig } from '@/features/storage/config'
export type { PublicStorageConfig } from '@/features/storage/config'
export {
  createPublicUpload,
  ensureImageFile,
  getPublicObjectUrl,
  putFileToPresignedUrl,
  uploadPublicFile,
} from '@/features/storage/public-storage'
export type { PublicUploadResult } from '@/features/storage/public-storage'
