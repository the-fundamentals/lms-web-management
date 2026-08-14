/**
 * Public object-store settings from Vite env ({@code VITE_*}).
 *
 * <p>See {@code .env.example} in the management-web project root.
 */
export type PublicStorageConfig = {
  /**
   * Base URL of the public S3 bucket (no trailing slash), e.g.
   * {@code https://your-public-bucket.s3.ap-southeast-1.amazonaws.com}.
   */
  baseUrl: string
}

/**
 * Reads public storage config from {@code import.meta.env}.
 *
 * @returns parsed {@link PublicStorageConfig}
 * @throws if {@code VITE_PUBLIC_STORAGE_BASE_URL} is missing
 */
export function loadPublicStorageConfig(): PublicStorageConfig {
  const baseUrl = import.meta.env.VITE_PUBLIC_STORAGE_BASE_URL
  if (!baseUrl) {
    throw new Error('Missing required env var: VITE_PUBLIC_STORAGE_BASE_URL')
  }
  return { baseUrl: baseUrl.replace(/\/+$/, '') }
}
